package middleware

import (
	"net"
	"net/http"
	"strconv"
	"sync"
	"time"
)

type clientBucket struct {
	tokens     float64
	lastSeen   time.Time
	mu         sync.Mutex
}

type RateLimiter struct {
	mu       sync.Mutex
	clients  map[string]*clientBucket
	rate     float64 // tokens per second
	capacity float64
}

func NewRateLimiter(requestsPerMinute float64) *RateLimiter {
	r := requestsPerMinute / 60.0
	return &RateLimiter{
		clients:  make(map[string]*clientBucket),
		rate:     r,
		capacity: requestsPerMinute,
	}
}

func (rl *RateLimiter) getClientBucket(ip string) *clientBucket {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	bucket, exists := rl.clients[ip]
	if !exists {
		bucket = &clientBucket{
			tokens:   rl.capacity,
			lastSeen: time.Now(),
		}
		rl.clients[ip] = bucket
	}
	return bucket
}

func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			ip = r.RemoteAddr
		}

		bucket := rl.getClientBucket(ip)
		bucket.mu.Lock()
		
		now := time.Now()
		elapsed := now.Sub(bucket.lastSeen).Seconds()
		bucket.lastSeen = now

		// Refill tokens based on elapsed time
		bucket.tokens += elapsed * rl.rate
		if bucket.tokens > rl.capacity {
			bucket.tokens = rl.capacity
		}

		if bucket.tokens < 1.0 {
			bucket.mu.Unlock()
			w.Header().Set("Retry-After", "60")
			http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
			return
		}

		bucket.tokens -= 1.0
		remaining := int(bucket.tokens)
		bucket.mu.Unlock()

		w.Header().Set("X-RateLimit-Remaining", strconv.Itoa(remaining))
		w.Header().Set("X-RateLimit-Reset", strconv.FormatInt(time.Now().Add(time.Minute).Unix(), 10))

		next.ServeHTTP(w, r)
	})
}
