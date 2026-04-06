import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, CheckCheck, Trash2, Filter } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const LearnerNotifications = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered = filter === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  const handleBulkDelete = async () => {
    const toDelete = filter === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;
    for (const n of toDelete) {
      await deleteNotification(n.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Notifications</h2>
          {unreadCount > 0 && (
            <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${filter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${filter === "unread" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
            >
              Unread
            </button>
          </div>
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={markAllAsRead}>
              <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark all read
            </Button>
          )}
          {filtered.length > 0 && (
            <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={handleBulkDelete}>
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete all
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-sm text-muted-foreground">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif) => (
            <div
              key={notif.id}
              className={`flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md ${
                !notif.is_read ? "border-primary/30 bg-primary/5" : ""
              }`}
            >
              <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${!notif.is_read ? "bg-primary" : "bg-transparent"}`} />
              <div
                className="flex-1 cursor-pointer"
                onClick={() => {
                  if (!notif.is_read) markAsRead(notif.id);
                  if (notif.coach_id) navigate("/browse-coaches");
                }}
              >
                <p className={`text-sm ${!notif.is_read ? "font-semibold text-foreground" : "text-foreground"}`}>
                  {notif.title}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{notif.message}</p>
                <p className="mt-2 text-xs text-muted-foreground/70">
                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {!notif.is_read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notif.id)}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearnerNotifications;
