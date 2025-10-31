export type ChatChannel = 'web' | 'whatsapp' | 'sms' | 'email';
export type ChatRole = 'user' | 'assistant' | 'system' | 'tool';

export interface Conversation {
  id: string;
  business_id: string;
  channel: ChatChannel;
  status: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  channel: ChatChannel;
  role: ChatRole;
  content: string;
  created_at: string;
}
