"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { CheckCircle2, XCircle, Building2, Mail, Calendar, Globe } from "lucide-react";
import MaterialTable, { createStatusChip, createActionButton, Column, ActionButton } from "@/components/MaterialTable";
import { 
  Box, 
  Typography, 
  Chip, 
  Button, 
  IconButton, 
  CircularProgress 
} from "@mui/material";

interface Company {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  industry: string | null;
  company_size: string | null;
  headquarters_location: string | null;
  verified: boolean;
  created_at: string;
  profile_id: string;
}

export default function CompanyApprovalPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("verified", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCompanies(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (companyId: string, approved: boolean) => {
    try {
      const { error } = await supabase
        .from("companies")
        .update({ verified: approved })
        .eq("id", companyId);

      if (error) throw error;

      // Update local state
      setCompanies(prev => 
        prev.map(company => 
          company.id === companyId 
            ? { ...company, verified: approved }
            : company
        ).filter(company => company.id !== companyId) // Remove from list after action
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update company");
    }
  };

  // Define table columns
  const columns: Column[] = [
    {
      id: 'name',
      label: 'Company',
      minWidth: 300,
      format: (value: any, row: any) => (
        <Box display="flex" alignItems="center" gap={2}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: 'grey.200',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Building2 size={20} color="#6b7280" />
          </Box>
          <Box minWidth={0} flex={1}>
            <Typography variant="body2" fontWeight="medium" noWrap>
              {row.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {row.description || "No description"}
            </Typography>
            {row.website && (
              <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                <Globe size={12} color="#6b7280" />
                <Typography
                  variant="caption"
                  color="primary"
                  component="a"
                  href={row.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  {row.website}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      ),
    },
    {
      id: 'industry',
      label: 'Industry',
      minWidth: 150,
      format: (value: any) => (
        <Typography variant="body2">
          {value || "Not specified"}
        </Typography>
      ),
    },
    {
      id: 'company_size',
      label: 'Size',
      minWidth: 120,
      format: (value: any) => (
        <Typography variant="body2">
          {value || "Not specified"}
        </Typography>
      ),
    },
    {
      id: 'headquarters_location',
      label: 'Location',
      minWidth: 200,
      format: (value: any) => (
        <Typography variant="body2" noWrap>
          {value || "Not specified"}
        </Typography>
      ),
    },
    {
      id: 'created_at',
      label: 'Registered',
      minWidth: 120,
      format: (value: any) => (
        <Box display="flex" alignItems="center" gap={0.5}>
          <Calendar size={16} color="#6b7280" />
          <Typography variant="body2">
            {new Date(value).toLocaleDateString()}
          </Typography>
        </Box>
      ),
    },
  ];

  // Define action buttons
  const actions: ActionButton[] = [
    createActionButton(
      <CheckCircle2 size={16} />,
      "Approve company",
      (row) => handleApproval(row.id, true),
      "success"
    ),
    createActionButton(
      <XCircle size={16} />,
      "Reject company",
      (row) => handleApproval(row.id, false),
      "error"
    ),
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Company Approval
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Review and approve company registrations
          </Typography>
        </Box>
        <Chip 
          label={`${companies.length} pending approval`} 
          color="primary" 
          variant="outlined"
          sx={{ px: 2, py: 1 }}
        />
      </Box>

      {/* Material UI Table */}
      <MaterialTable
        columns={columns}
        rows={companies}
        loading={loading}
        error={error}
        onRetry={fetchCompanies}
        actions={actions}
        emptyMessage="No companies pending approval. All companies have been reviewed."
        emptyIcon={<Building2 size={48} color="#9ca3af" />}
        stickyHeader
        maxHeight={600}
        showPagination={false}
      />
    </Box>
  );
}


