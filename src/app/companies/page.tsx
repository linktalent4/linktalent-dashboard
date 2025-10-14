"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Search, Building2, Globe, MapPin, Calendar, Trash2, CheckCircle2 } from "lucide-react";
import MaterialTable, { createStatusChip, createActionButton, Column, ActionButton } from "@/components/MaterialTable";
import { 
  Box, 
  TextField, 
  InputAdornment, 
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

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchCompanies();
  }, [page, searchTerm, rowsPerPage]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("companies")
        .select("*", { count: "exact" });

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,industry.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(page * rowsPerPage, (page + 1) * rowsPerPage - 1);

      if (error) throw error;
      setCompanies(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchCompanies();
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
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
              {row.description ? (row.description.length > 80 ? `${row.description.substring(0, 80)}...` : row.description) : "No description"}
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
                  {row.website.length > 30 ? `${row.website.substring(0, 30)}...` : row.website}
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
        <Box display="flex" alignItems="center" gap={0.5}>
          <MapPin size={16} color="#6b7280" />
          <Typography variant="body2" noWrap>
            {value || "Not specified"}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'verified',
      label: 'Status',
      minWidth: 120,
      format: (value: any) => (
        <Box display="flex" alignItems="center" gap={0.5}>
          <CheckCircle2 size={16} color={value ? "#10b981" : "#f59e0b"} />
          <Typography variant="body2" color={value ? "success.main" : "warning.main"}>
            {value ? "Verified" : "Pending"}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'created_at',
      label: 'Joined',
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
      <Trash2 size={16} />,
      "Delete company",
      (row) => console.log("Delete company", row.id),
      "error"
    ),
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Companies
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Manage company profiles and information
          </Typography>
        </Box>
        <Chip 
          label={`${totalCount} total companies`} 
          color="primary" 
          variant="outlined"
          sx={{ px: 2, py: 1 }}
        />
      </Box>

      {/* Search Bar */}
      <Box component="form" onSubmit={handleSearch} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search companies by name or industry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={20} />
              </InputAdornment>
            ),
          }}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      {/* Material UI Table */}
      <MaterialTable
        columns={columns}
        rows={companies}
        loading={loading}
        error={error}
        onRetry={fetchCompanies}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        actions={actions}
        emptyMessage={searchTerm ? "No companies found matching your search." : "No companies have registered yet."}
        emptyIcon={<Building2 size={48} color="#9ca3af" />}
        stickyHeader
        maxHeight={600}
      />
    </Box>
  );
}


