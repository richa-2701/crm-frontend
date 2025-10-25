//frontend/app/dashboard/clients/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clientApi, type ApiClient } from "@/lib/api";
import { format } from "date-fns";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Building, AlertTriangle, PlusCircle } from "lucide-react";
import { parseAsUTCDate } from "@/lib/date-format";

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await clientApi.getAllClients();
        // The API returns nested JSON strings for contacts/attachments, parse them.
        const parsedData = data.map(client => ({
            ...client,
            contacts: typeof client.contacts === 'string' ? JSON.parse(client.contacts) : client.contacts,
            attachments: typeof client.attachments === 'string' ? JSON.parse(client.attachments) : client.attachments,
        }));
        setClients(parsedData || []);
      } catch (err: any) {
        console.error("Failed to fetch clients:", err);
        setError(err.message || "An unknown error occurred while fetching clients.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleRowClick = (clientId: number) => {
    router.push(`/dashboard/clients/${clientId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading Clients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Fetching Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clients</h1>
        {/* You can add a "Create Client" button here if needed */}
      </header>

      <Card>
        <CardHeader>
          <CardTitle>All Active Clients</CardTitle>
        </CardHeader>
        <CardContent>
          {clients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Primary Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">Segment</TableHead>
                  <TableHead className="text-right">Converted On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => {
                  const primaryContact = client.contacts && client.contacts[0] ? client.contacts[0] : null;
                  const convertedDate = parseAsUTCDate(client.converted_date);

                  return (
                    <TableRow key={client.id} onClick={() => handleRowClick(client.id)} className="cursor-pointer">
                      <TableCell className="font-medium">{client.company_name}</TableCell>
                      <TableCell>{primaryContact?.contact_name || 'N/A'}</TableCell>
                      <TableCell>{client.company_email || primaryContact?.email || 'N/A'}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {client.segment && <Badge variant="outline">{client.segment}</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        {convertedDate ? format(convertedDate, "MMM d, yyyy") : "N/A"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Building className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-xl font-semibold">No Clients Found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Once a lead is won, they will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}