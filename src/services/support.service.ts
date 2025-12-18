import { storage } from '@/utils/storage';
import { Ticket, TicketMessage, TicketStats, Admin } from '@/types/ticket';
import { 
  mockTickets, 
  mockMessages, 
  mockStats, 
  mockAdmins 
} from '@/data/mockData';

const TICKETS_KEY = 'support_tickets';
const MESSAGES_KEY = 'support_ticket_messages';

/* Initialize mock data once */
export function initMockData(): void {
  if (!localStorage.getItem(TICKETS_KEY)) {
    storage.set(TICKETS_KEY, mockTickets);
  }
  if (!localStorage.getItem(MESSAGES_KEY)) {
    storage.set(MESSAGES_KEY, mockMessages);
  }
}

/* TICKETS */
export function listAllTickets(): Ticket[] {
  return storage.get<Ticket[]>(TICKETS_KEY, mockTickets);
}

export function listTicketsByCompany(companyId: string): Ticket[] {
  const tickets = storage.get<Ticket[]>(TICKETS_KEY, mockTickets);
  return tickets.filter((t) => t.companyId === companyId);
}

export function getTicketById(id: string): Ticket | undefined {
  const tickets = storage.get<Ticket[]>(TICKETS_KEY, mockTickets);
  return tickets.find((t) => t.id === id);
}

export function createTicket(payload: {
  subject: string;
  description: string;
  category: Ticket['category'];
  priority: Ticket['priority'];
  companyId: string;
  companyName: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
}): Ticket {
  const tickets = storage.get<Ticket[]>(TICKETS_KEY, mockTickets);
  
  const newTicket: Ticket = {
    id: String(Date.now()),
    ticketNumber: `TKT-${String(tickets.length + 1).padStart(3, '0')}`,
    subject: payload.subject,
    description: payload.description,
    status: 'open',
    priority: payload.priority,
    category: payload.category,
    companyId: payload.companyId,
    companyName: payload.companyName,
    clientId: payload.clientId,
    clientName: payload.clientName,
    clientEmail: payload.clientEmail,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    slaBreached: false,
    unreadCount: 0,
  };

  tickets.push(newTicket);
  storage.set(TICKETS_KEY, tickets);

  return newTicket;
}

export function updateTicket(
  id: string, 
  updates: Partial<Pick<Ticket, 'status' | 'priority' | 'assignedAdminId' | 'assignedAdminName' | 'tags'>>
): Ticket | undefined {
  const tickets = storage.get<Ticket[]>(TICKETS_KEY, mockTickets);
  const index = tickets.findIndex((t) => t.id === id);
  
  if (index === -1) return undefined;

  tickets[index] = {
    ...tickets[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  storage.set(TICKETS_KEY, tickets);
  return tickets[index];
}

/* MESSAGES */
export function getMessages(ticketId: string): TicketMessage[] {
  const allMessages = storage.get<Record<string, TicketMessage[]>>(MESSAGES_KEY, mockMessages);
  return allMessages[ticketId] || [];
}

export function addMessage(
  ticketId: string, 
  payload: {
    content: string;
    sender: TicketMessage['sender'];
    senderName: string;
    isInternal: boolean;
    attachments?: TicketMessage['attachments'];
  }
): TicketMessage {
  const allMessages = storage.get<Record<string, TicketMessage[]>>(MESSAGES_KEY, mockMessages);
  
  const newMessage: TicketMessage = {
    id: `m${Date.now()}`,
    ticketId,
    content: payload.content,
    sender: payload.sender,
    senderName: payload.senderName,
    isInternal: payload.isInternal,
    attachments: payload.attachments || [],
    createdAt: new Date().toISOString(),
  };

  if (!allMessages[ticketId]) {
    allMessages[ticketId] = [];
  }
  allMessages[ticketId].push(newMessage);
  
  storage.set(MESSAGES_KEY, allMessages);

  // Update ticket's unread count and timestamp
  const tickets = storage.get<Ticket[]>(TICKETS_KEY, mockTickets);
  const ticketIndex = tickets.findIndex((t) => t.id === ticketId);
  if (ticketIndex !== -1) {
    tickets[ticketIndex].updatedAt = new Date().toISOString();
    if (!payload.isInternal) {
      tickets[ticketIndex].unreadCount += 1;
    }
    storage.set(TICKETS_KEY, tickets);
  }

  return newMessage;
}

/* STATS */
export function getStats(): TicketStats {
  const tickets = storage.get<Ticket[]>(TICKETS_KEY, mockTickets);
  
  return {
    openTickets: tickets.filter((t) => t.status === 'open').length,
    urgentTickets: tickets.filter((t) => t.priority === 'urgent').length,
    waitingResponse: tickets.filter((t) => t.status === 'waiting_response').length,
    avgFirstResponseTime: mockStats.avgFirstResponseTime,
    resolvedToday: tickets.filter((t) => {
      if (!t.resolvedAt) return false;
      const resolved = new Date(t.resolvedAt);
      const today = new Date();
      return resolved.toDateString() === today.toDateString();
    }).length,
    slaBreached: tickets.filter((t) => t.slaBreached).length,
  };
}

/* ADMINS */
export function getAdmins(): Admin[] {
  return mockAdmins;
}

export function getAdminById(id: string): Admin | undefined {
  return mockAdmins.find((a) => a.id === id);
}
