// frontend/components/drips/drips-table.tsx
"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { ApiDripSequenceList } from "@/lib/api";
import { useRouter } from "next/navigation";
// --- START OF FIX: Import the robust formatDate function from the utility file ---
import { formatDate } from "@/lib/date-format";
// --- END OF FIX ---

interface DripsTableProps {
  drips: ApiDripSequenceList[];
  onDelete: (id: number) => void;
  isLoading: boolean;
}

export function DripsTable({ drips, onDelete, isLoading }: DripsTableProps) {
  const router = useRouter();

  // --- START OF FIX: Remove the old, simple formatDate function ---
  // const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();
  // --- END OF FIX ---

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Drip Code</TableHead>
            <TableHead>Drip Name</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={5} className="text-center h-24">Loading sequences...</TableCell></TableRow>
          ) : drips.length === 0 ? (
            <TableRow><TableCell colSpan={5} className="text-center h-24">No drip sequences found.</TableCell></TableRow>
          ) : (
            drips.map((drip) => (
              <TableRow key={drip.id}>
                <TableCell className="font-mono">{drip.drip_code}</TableCell>
                <TableCell className="font-medium">{drip.drip_name}</TableCell>
                <TableCell>{drip.created_by}</TableCell>
                {/* This now uses the correct, imported formatDate function */}
                <TableCell>{formatDate(drip.created_at)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/drip-sequence/${drip.id}`)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(drip.id)} className="text-red-500">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}