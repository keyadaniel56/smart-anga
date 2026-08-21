package websocket

import (
	"encoding/json"
	"log"
	"sync"
)

type Hub struct {
	clients    map[*Client]bool
	register   chan *Client
	unregister chan *Client
	broadcast  chan []byte
	subs       map[string]map[*Client]bool
	mu         sync.Mutex
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan []byte),
		subs:       make(map[string]map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			log.Printf("WebSocket client connected: %p", client)
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				h.removeSubscriptions(client)
				close(client.send)
				log.Printf("WebSocket client disconnected: %p", client)
			}
		case message := <-h.broadcast:
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
					h.removeSubscriptions(client)
				}
			}
		}
	}
}

func (h *Hub) removeSubscriptions(client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	for region, clients := range h.subs {
		if _, ok := clients[client]; ok {
			delete(clients, client)
			if len(clients) == 0 {
				delete(h.subs, region)
			}
		}
	}
}

func (h *Hub) HandleSubscription(client *Client, msg []byte) {
	var payload struct {
		Action   string  `json:"action"`
		Lat      float64 `json:"lat"`
		Lon      float64 `json:"lon"`
		RadiusKm float64 `json:"radiusKm"`
	}

	if err := json.Unmarshal(msg, &payload); err != nil {
		log.Printf("Invalid WS subscription payload: %v", err)
		return
	}

	if payload.Action == "subscribe" {
		h.mu.Lock()
		defer h.mu.Unlock()
		regionKey := "default_region"
		if h.subs[regionKey] == nil {
			h.subs[regionKey] = make(map[*Client]bool)
		}
		h.subs[regionKey][client] = true
		log.Printf("Client %p subscribed to region updates", client)
	}
}
