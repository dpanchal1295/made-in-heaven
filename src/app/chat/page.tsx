import { AppShell } from '@/components/layout/AppShell';
import { ChatContainer } from '@/components/chat/ChatContainer';

export const metadata = {
  title: 'Chat with Maya • Made in Heaven',
  description: 'Personalized Indian wedding planning manager powered by Gemini',
};

export default function ChatPage() {
  return (
    <AppShell currentTab="chat" fullHeight>
      <ChatContainer />
    </AppShell>
  );
}

