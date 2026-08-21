package websocket

import (
	"encoding/json"
	"log"
	"sync"
)

type ClientSubscription struct {
	Lat      float64
	Lon      float64
	RadiusKm float64
}

type Hub struct {
	clients    map[*Client]bool
	register   chan *Client
	unregister chan *Client
	broadcast  chan []byte
	mu         sync.Mutex
	subs       map[*Client]ClientSubscription
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan []byte),
		subs:       make(map[*Client]ClientSubscription),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
			log.Println("WebSocket client connected")

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				delete(h.subs, client)
				close(client.Send)
			}
			h.mu.Unlock()
			log.Println("WebSocket client disconnected")

		case message := <-h.broadcast:
			h.mu.Lock()
			for client := range h.clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.clients, client)
					delete(h.subs, client)
				}
			}
			h.mu.Unlock()
		}
	}
}

func (h *Hub) BroadcastMessage(msgType string, data interface{}) {
	payload := map[string]interface{}{
		"type": msgType,
		"data": data,
	}
	bytes, err := json.Marshal(payload)
	if err != nil {
		log.Printf("Failed to marshal broadcast message: %v", err)
		return
	}
	h.broadcast <- bytes
}

func (h *Hub) UpdateSubscription(client *Client, sub ClientSubscription) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.subs[client] = sub
}
