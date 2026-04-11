"""
ADK / AgentTool:
- Nested runs often expose invocation_context.user_id as the literal "user"; do not write
  that over a real learner id already in state (see merge_* callers in sub-agent init).
- AgentTool copies ``tool_context.state`` into the child session; some /run paths only set
  the learner on invocation first — sync into state before run_async so journal/reminder
  APIs always see the same user_id as the parent session.
"""


def merge_invocation_user_id_into_state(callback_context) -> None:
    """CallbackContext hoặc ToolContext: ghi user_id từ invocation vào state nếu là id thật."""
    inv = getattr(callback_context, "_invocation_context", None)
    if inv is None:
        return
    raw = getattr(inv, "user_id", None)
    if raw is None:
        return
    s = str(raw).strip()
    if not s or s == "user":
        return
    callback_context.state["user_id"] = s
