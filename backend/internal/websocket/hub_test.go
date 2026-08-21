package websocket

import (
	"testing"
)

func TestNewHub(t *testing.T) {
	hub := NewHub()
	if hub == nil {
		t.Fatal("Expected hub to be initialized, got nil")
	}
	if hub.clients == nil {
		t.Error("Expected clients map to be initialized")
	}
	if hub.subs == nil {
		t.Error("Expected subs map to be initialized")
	}
}
