import { MainLayout } from "@/components/layout/main-layout";
import { PageSeo } from "@/components/seo/page-seo";
import { CompanySettingsPage } from "@/components/settings/company-settings-page";
import { AdminUsersPage } from "@/components/settings/admin-users-page";
import { GdprManagementPage } from "@/components/settings/gdpr-management-page";
import { ContactMessagesPage } from "@/components/settings/contact-messages-page";
import { WageTypesPage } from "@/components/settings/wage-types-page";
import { DatevImportWizard } from "@/components/import/datev-import-wizard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Shield, Mail, Upload, ListPlus } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

export default function Settings() {
  const { isAdmin } = useAuth();

  return (
    <MainLayout>
      <PageSeo title="Einstellungen" description="Unternehmenseinstellungen, Benutzerverwaltung und Datenschutz konfigurieren." path="/settings" />
      <Tabs defaultValue="company" className="space-y-6">
        <TabsList>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Firmenstammdaten
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Benutzer
          </TabsTrigger>
          <TabsTrigger value="wage-types" className="flex items-center gap-2">
            <ListPlus className="h-4 w-4" />
            Lohnarten
          </TabsTrigger>
          <TabsTrigger value="gdpr" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            DSGVO
          </TabsTrigger>
          {isAdmin() && (
            <TabsTrigger value="datev-import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              DATEV Import
            </TabsTrigger>
          )}
          {isAdmin() && (
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Nachrichten
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="company">
          <CompanySettingsPage />
        </TabsContent>
        <TabsContent value="users">
          <AdminUsersPage />
        </TabsContent>
        <TabsContent value="wage-types">
          <WageTypesPage />
        </TabsContent>
        <TabsContent value="gdpr">
          <GdprManagementPage />
        </TabsContent>
        {isAdmin() && (
          <TabsContent value="datev-import">
            <DatevImportWizard />
          </TabsContent>
        )}
        {isAdmin() && (
          <TabsContent value="messages">
            <ContactMessagesPage />
          </TabsContent>
        )}
      </Tabs>
    </MainLayout>
  );
}
