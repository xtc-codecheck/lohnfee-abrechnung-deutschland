import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { CompanySettingsPage } from "@/components/settings/company-settings-page";
import { AdminUsersPage } from "@/components/settings/admin-users-page";
import { GdprManagementPage } from "@/components/settings/gdpr-management-page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Shield } from "lucide-react";

export default function Settings() {
  return (
    <MainLayout>
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
          <TabsTrigger value="gdpr" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            DSGVO
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <CompanySettingsPage />
        </TabsContent>
        <TabsContent value="users">
          <AdminUsersPage />
        </TabsContent>
        <TabsContent value="gdpr">
          <GdprManagementPage />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
