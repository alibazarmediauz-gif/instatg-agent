import { useState, useEffect, useCallback } from 'react';

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    link?: string;
    created_at: string;
}

export function useNotifications(tenantId: string) {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch initial list
    useEffect(() => {
        if (!tenantId) return;

        const fetchNotifications = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/notifications?tenant_id=${tenantId}`);
                if (res.ok) {
                    const data: AppNotification[] = await res.json();
                    setNotifications(data);
                    setUnreadCount(data.filter(n => !n.is_read).length);
                }
            } catch (err) {
                console.error("Failed to fetch notifications:", err);
            }
        };

        fetchNotifications();
    }, [tenantId]);

    // Setup SSE Stream
    useEffect(() => {
        if (!tenantId) return;

        // Request browser push permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const eventSource = new EventSource(`http://localhost:8000/api/notifications/stream?tenant_id=${tenantId}`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.event_type === "new_notification") {
                    const newNotif = data as AppNotification;

                    // Add to state
                    setNotifications(prev => [newNotif, ...prev]);
                    setUnreadCount(prev => prev + 1);

                    // Show Browser Push Notification
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new window.Notification(newNotif.title, {
                            body: newNotif.message,
                            icon: '/favicon.ico'
                        });
                    }
                }
            } catch (err) {
                console.error("SSE parse error", err);
            }
        };

        return () => {
            eventSource.close();
        };
    }, [tenantId]);

    const markAsRead = useCallback(async (id: string) => {
        try {
            await fetch(`http://localhost:8000/api/notifications/${id}/read?tenant_id=${tenantId}`, {
                method: 'POST'
            });
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error(err);
        }
    }, [tenantId]);

    const markAllAsRead = useCallback(async () => {
        try {
            await fetch(`http://localhost:8000/api/notifications/read-all?tenant_id=${tenantId}`, {
                method: 'POST'
            });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error(err);
        }
    }, [tenantId]);

    return { notifications, unreadCount, markAsRead, markAllAsRead };
}
