import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageSeo } from "@/components/seo/page-seo";
import { LegalLayout } from "@/components/layout/legal-layout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, MessageSquare, HelpCircle, FileText } from "lucide-react";

export default function Kontakt() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      toast({ title: "Bitte füllen Sie alle Felder aus.", variant: "destructive" });
      return;
    }

    if (form.name.length > 100 || form.email.length > 255 || form.subject.length > 200 || form.message.length > 5000) {
      toast({ title: "Eingabe zu lang. Bitte kürzen Sie Ihre Angaben.", variant: "destructive" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast({ title: "Bitte geben Sie eine gültige E-Mail-Adresse ein.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
    });
    setLoading(false);

    if (error) {
      toast({ title: "Fehler beim Senden", description: "Bitte versuchen Sie es später erneut.", variant: "destructive" });
    } else {
      setSubmitted(true);
    }
  };

  return (
    <LegalLayout>
      <PageSeo
        title="Kontakt & Support"
        description="Kontaktieren Sie das LohnPro-Team – wir helfen Ihnen bei Fragen zur Lohnabrechnung, Einrichtung und technischem Support."
        path="/kontakt"
      />

      <div className="container mx-auto max-w-5xl px-6 py-12">

        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Kontakt & Support</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Haben Sie Fragen? Wir helfen Ihnen gerne weiter.
          </p>
        </div>

        {/* Quick Links */}
        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          {[
            { icon: HelpCircle, title: "FAQ", desc: "Häufig gestellte Fragen", action: () => navigate("/#faq") },
            { icon: FileText, title: "Dokumentation", desc: "Anleitungen & Hilfe", action: () => {} },
            { icon: MessageSquare, title: "Live-Support", desc: "Mo–Fr, 9–17 Uhr", action: () => {} },
          ].map((item) => (
            <Card
              key={item.title}
              className="cursor-pointer border-border/60 transition-shadow hover:shadow-elegant"
              onClick={item.action}
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle>Nachricht senden</CardTitle>
                <CardDescription>
                  Füllen Sie das Formular aus und wir melden uns innerhalb von 24 Stunden bei Ihnen.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold">Nachricht gesendet!</h3>
                    <p className="mt-2 max-w-sm text-muted-foreground">
                      Vielen Dank für Ihre Anfrage. Wir werden uns schnellstmöglich bei Ihnen melden.
                    </p>
                    <Button variant="outline" className="mt-6" onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}>
                      Weitere Nachricht senden
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          placeholder="Ihr Name"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          maxLength={100}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-Mail *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="ihre@email.de"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          maxLength={255}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Betreff *</Label>
                      <Input
                        id="subject"
                        placeholder="Worum geht es?"
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        maxLength={200}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Nachricht *</Label>
                      <Textarea
                        id="message"
                        placeholder="Beschreiben Sie Ihr Anliegen..."
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        maxLength={5000}
                        rows={6}
                        required
                      />
                      <p className="text-xs text-muted-foreground text-right">{form.message.length}/5000</p>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? (
                        "Wird gesendet..."
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Nachricht senden
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Info Sidebar */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="border-border/60">
              <CardHeader>
                <CardTitle className="text-lg">Kontaktdaten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {[
                  { icon: Mail, label: "E-Mail", value: "support@lohnpro.app" },
                  { icon: Phone, label: "Telefon", value: "+49 (0) 30 123456-0" },
                  { icon: MapPin, label: "Adresse", value: "Musterstraße 1, 10115 Berlin" },
                  { icon: Clock, label: "Erreichbarkeit", value: "Mo–Fr, 9:00–17:00 Uhr" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.value}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-primary/5">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground">💡 Tipp</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Viele Fragen werden bereits in unseren{" "}
                  <button onClick={() => navigate("/#faq")} className="text-primary hover:underline">
                    FAQ
                  </button>{" "}
                  beantwortet. Schauen Sie dort zuerst nach – vielleicht finden Sie Ihre Antwort sofort.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
