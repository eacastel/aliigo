import { redirect } from "next/navigation";

export default function ConversationRedirect({
  params,
}: {
  params: { conversationId: string };
}) {
  const id = params.conversationId;
  redirect(`/dashboard/messages?conversationId=${id}`);
}
