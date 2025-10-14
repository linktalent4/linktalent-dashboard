"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Search, User, Mail, MapPin, Calendar, Trash2, X } from "lucide-react";
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

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  location: string | null;
  bio: string | null;
  profile_completed: boolean;
  created_at: string;
  profile_id: string;
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchCandidates();
  }, [page, searchTerm, rowsPerPage]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("candidate_profiles")
        .select("*", { count: "exact" });

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(page * rowsPerPage, (page + 1) * rowsPerPage - 1);

      if (error) throw error;
      setCandidates(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch candidates");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchCandidates();
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteCandidate = async (candidateId: string) => {
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from("candidate_profiles")
        .delete()
        .eq("id", candidateId);

      if (error) throw error;

      // Remove candidate from local state
      setCandidates(prev => prev.filter(candidate => candidate.id !== candidateId));
      setTotalCount(prev => prev - 1);
      setDeleteCandidateId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete candidate");
    } finally {
      setIsDeleting(false);
    }
  };

  // Define table columns
  const columns: Column[] = [
    {
      id: 'full_name',
      label: 'Candidate',
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
            <User size={20} color="#6b7280" />
          </Box>
          <Box minWidth={0} flex={1}>
            <Typography variant="body2" fontWeight="medium" noWrap>
              {row.full_name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {row.bio ? (row.bio.length > 80 ? `${row.bio.substring(0, 80)}...` : row.bio) : "No bio available"}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'email',
      label: 'Contact',
      minWidth: 200,
      format: (value: any, row: any) => (
        <Box>
          <Typography variant="body2">{row.email}</Typography>
          {row.phone && (
            <Typography variant="caption" color="text.secondary">
              {row.phone}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'location',
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
      id: 'profile_completed',
      label: 'Status',
      minWidth: 120,
      format: (value: any) => (
        <Box display="flex" alignItems="center" gap={0.5}>
          <Typography variant="body2" color={value ? "success.main" : "warning.main"}>
            {value ? "Complete" : "Incomplete"}
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
      "Delete candidate",
      (row) => setDeleteCandidateId(row.id),
      "error"
    ),
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Candidates
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Manage candidate profiles and information
          </Typography>
        </Box>
        <Chip 
          label={`${totalCount} total candidates`} 
          color="primary" 
          variant="outlined"
          sx={{ px: 2, py: 1 }}
        />
      </Box>

      {/* Search Bar */}
      <Box component="form" onSubmit={handleSearch} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search candidates by name or email..."
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
        rows={candidates}
        loading={loading}
        error={error}
        onRetry={fetchCandidates}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        actions={actions}
        emptyMessage={searchTerm ? "No candidates found matching your search." : "No candidates have registered yet."}
        emptyIcon={<User size={48} color="#9ca3af" />}
        stickyHeader
        maxHeight={600}
      />

      {/* Delete Confirmation Modal */}
      {deleteCandidateId && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
          }}
        >
          <Box
            sx={{
              backgroundColor: 'white',
              borderRadius: 2,
              p: 3,
              maxWidth: 400,
              width: '100%',
              mx: 2,
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" component="h3">
                Delete Candidate
              </Typography>
              <IconButton
                onClick={() => setDeleteCandidateId(null)}
                size="small"
              >
                <X size={20} />
              </IconButton>
            </Box>
            <Typography color="text.secondary" mb={3}>
              Are you sure you want to delete this candidate? This action cannot be undone.
            </Typography>
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                onClick={() => setDeleteCandidateId(null)}
                disabled={isDeleting}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleDeleteCandidate(deleteCandidateId)}
                disabled={isDeleting}
                fullWidth
                startIcon={isDeleting ? <CircularProgress size={16} /> : <Trash2 size={16} />}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}


