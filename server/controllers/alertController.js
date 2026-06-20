import { supabase } from "../config/supabase.js";
import { syncUserAlerts } from "../services/alertService.js";

export const getAlerts = async (req, res, next) => {
  try {
    // Sync alerts first so they are populated
    await syncUserAlerts(req.user.id, req.user.location);

    const { data: alerts, error } = await supabase
      .from("alerts")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const formatted = (alerts || []).map((a) => ({
      id: a.id,
      userId: a.user_id,
      title: a.title,
      message: a.message,
      severity: a.severity,
      category: a.category,
      isRead: a.is_read,
      createdAt: a.created_at,
    }));

    res.status(200).json({ success: true, alerts: formatted });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const { count, error } = await supabase
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", req.user.id)
      .eq("is_read", false);

    if (error) throw error;

    res.status(200).json({ success: true, count: count || 0 });
  } catch (error) {
    next(error);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const { id, ids } = req.body;
    const idsToUpdate = ids || (id ? [id] : []);

    if (idsToUpdate.length === 0) {
      const error = new Error("Please provide id or ids to mark as read");
      error.statusCode = 400;
      throw error;
    }

    const { data, error } = await supabase
      .from("alerts")
      .update({ is_read: true })
      .in("id", idsToUpdate)
      .eq("user_id", req.user.id)
      .select();

    if (error) throw error;

    res.status(200).json({ success: true, message: "Alerts marked as read successfully" });
  } catch (error) {
    next(error);
  }
};

export const markAllRead = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from("alerts")
      .update({ is_read: true })
      .eq("user_id", req.user.id)
      .eq("is_read", false);

    if (error) throw error;

    res.status(200).json({ success: true, message: "All alerts marked as read successfully" });
  } catch (error) {
    next(error);
  }
};
