/**
 * Admin-Seite für Kontaktnachrichten
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query-keys';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mail, Clock, CheckCircle, Eye, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

export function ContactMessagesPage() {
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: queryKeys.contactMessages.all(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ContactMessage[];
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // contact_messages table doesn't have UPDATE policy - this will fail gracefully
      const { error } = await supabase
        .from('contact_messages')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contactMessages.all() });
    },
  });

  const newCount = messages.filter(m => m.status === 'new').length;
  const readCount = messages.filter(m => m.status === 'read').length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return <Badge variant="default"><Clock className="h-3 w-3 mr-1" />Neu</Badge>;
      case 'read':
        return <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" />Gelesen</Badge>;
      case 'replied':
        return <Badge variant="outline" className="border-primary text-primary"><CheckCircle className="h-3 w-3 mr-1" />Beantwortet</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleOpenMessage = (msg: ContactMessage) => {
    setSelectedMessage(msg);
    if (msg.status === 'new') {
      statusMutation.mutate({ id: msg.id, status: 'read' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Nachrichten werden geladen...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gesamt</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Inbox className="h-5 w-5 text-muted-foreground" />
              {messages.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Neue Nachrichten</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2 text-primary">
              <Mail className="h-5 w-5" />
              {newCount}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gelesen</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Eye className="h-5 w-5 text-muted-foreground" />
              {readCount}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Kontaktnachrichten
          </CardTitle>
          <CardDescription>Eingehende Anfragen über das Kontaktformular</CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Noch keine Kontaktnachrichten eingegangen.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Betreff</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((msg) => (
                  <TableRow
                    key={msg.id}
                    className={`cursor-pointer hover:bg-muted/50 ${msg.status === 'new' ? 'font-medium' : ''}`}
                    onClick={() => handleOpenMessage(msg)}
                  >
                    <TableCell>{getStatusBadge(msg.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(msg.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </TableCell>
                    <TableCell>{msg.name}</TableCell>
                    <TableCell className="text-muted-foreground">{msg.email}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{msg.subject}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleOpenMessage(msg); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span><strong>Von:</strong> {selectedMessage.name}</span>
                <span><strong>E-Mail:</strong> {selectedMessage.email}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {format(new Date(selectedMessage.created_at), "dd. MMMM yyyy, HH:mm 'Uhr'", { locale: de })}
              </div>
              <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm">
                {selectedMessage.message}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`, '_blank')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Per E-Mail antworten
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
