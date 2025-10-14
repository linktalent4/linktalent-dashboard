"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Search,
  MapPin,
  Calendar,
  DollarSign,
  Trash2,
  Users,
  Briefcase,
  X,
} from "lucide-react";
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

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  job_type: string;
  experience_level: string;
  remote_type: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  status: string;
  application_count: number;
  created_at: string;
  company_id: string;
  company_name?: string;
  skills?: string[];
}

// Helper functions for table formatting
const formatSalary = (min: number | null, max: number | null, currency: string) => {
  if (!min && !max) return "Not specified";
  if (min && max) return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
  if (min) return `${currency} ${min.toLocaleString()}+`;
  if (max) return `Up to ${currency} ${max.toLocaleString()}`;
  return "Not specified";
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchJobs();
  }, [page, searchTerm, rowsPerPage]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      // First, get all jobs
      let jobsQuery = supabase.from("jobs").select("*", { count: "exact" });

      if (searchTerm) {
        jobsQuery = jobsQuery.or(
          `title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
        );
      }

      const { data: jobsData, error: jobsError, count } = await jobsQuery
        .order("created_at", { ascending: false })
        .range(
          page * rowsPerPage,
          (page + 1) * rowsPerPage - 1
        );

      if (jobsError) throw jobsError;

      if (!jobsData || jobsData.length === 0) {
        setJobs([]);
        setTotalCount(count || 0);
        return;
      }

      // Get unique company IDs
      const companyIds = [...new Set(jobsData.map(job => job.company_id))];
      
      // Fetch company names
      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("profile_id, name")
        .in("profile_id", companyIds);

      if (companiesError) throw companiesError;

      // Create a map of company_id to company_name
      const companyMap = new Map();
      companiesData?.forEach(company => {
        companyMap.set(company.profile_id, company.name);
      });

      // Transform jobs data to include company names
      const transformedData = jobsData.map(job => ({
        ...job,
        company_name: companyMap.get(job.company_id) || 'Unknown Company'
      }));
      
      setJobs(transformedData);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchJobs();
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      setIsDeleting(true);
      
      console.log("Attempting to delete job with ID:", jobId);
      
      // First, let's check if the job exists and get its details
      const { data: jobData, error: fetchError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();
      
      if (fetchError) {
        console.error("Could not fetch job:", fetchError);
        throw new Error("Job not found");
      }
      
      console.log("Job found:", jobData);
      
      // Try to delete the job directly first
      const { error, data } = await supabase
        .from("jobs")
        .delete()
        .eq("id", jobId)
        .select();
      
      if (error) {
        console.error("Direct delete failed:", error);
        
        // If direct delete fails due to foreign key constraints, try cascade delete
        if (error.code === '23503' || error.message.includes('foreign key')) {
          console.log("Foreign key constraint detected, trying cascade delete...");
          
          // Delete related records first
          await supabase
            .from("job_applications")
            .delete()
            .eq("job_id", jobId);
          
          await supabase
            .from("saved_jobs")
            .delete()
            .eq("job_id", jobId);
          
          // Try deleting the job again
          const { error: retryError, data: retryData } = await supabase
            .from("jobs")
            .delete()
            .eq("id", jobId)
            .select();
          
          if (retryError) {
            throw retryError;
          }
          
          console.log("Job deleted after cascade:", retryData);
        } else {
          throw error;
        }
      } else {
        console.log("Job deleted successfully:", data);
      }
      
      // Update local state
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
      setTotalCount((prev) => prev - 1);
      setDeleteJobId(null);
      
      // Show success message
      alert("Job deleted successfully!");
      
    } catch (err) {
      console.error("Delete error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      alert(`Failed to delete job: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Define table columns
  const columns: Column[] = [
    {
      id: 'title',
      label: 'Job Title',
      minWidth: 300,
      format: (value: any, row: any) => (
        <Box>
          <Typography variant="body2" fontWeight="medium" noWrap>
            {row.title}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {row.description.length > 100 ? `${row.description.substring(0, 100)}...` : row.description}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'job_type',
      label: 'Type & Level',
      minWidth: 120,
      format: (value: any, row: any) => (
        <Box>
          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
            {row.job_type}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
            {row.experience_level}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'location',
      label: 'Location',
      minWidth: 180,
      format: (value: any, row: any) => (
        <Box display="flex" alignItems="center" gap={0.5}>
          <MapPin size={16} color="#6b7280" />
          <Box>
            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
              {row.remote_type}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {row.location}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'salary',
      label: 'Salary',
      minWidth: 120,
      format: (value: any, row: any) => (
        <Box display="flex" alignItems="center" gap={0.5}>
          <DollarSign size={16} color="#6b7280" />
          <Typography variant="body2" noWrap>
            {formatSalary(row.salary_min, row.salary_max, row.salary_currency)}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'application_count',
      label: 'Applications',
      minWidth: 100,
      format: (value: any, row: any) => (
        <Box display="flex" alignItems="center" gap={0.5}>
          <Users size={16} color="#6b7280" />
          <Typography variant="body2">
            {row.application_count}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      format: (value) => createStatusChip(value),
    },
    {
      id: 'created_at',
      label: 'Posted',
      minWidth: 100,
      format: (value) => (
        <Box display="flex" alignItems="center" gap={0.5}>
          <Calendar size={16} color="#6b7280" />
          <Typography variant="body2">
            {new Date(value).toLocaleDateString()}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'company_name',
      label: 'Company',
      minWidth: 220,
      format: (value: any, row: any) => (
        <Box>
          <Typography variant="body2" fontWeight="medium" noWrap>
            {row.company_name}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontFamily="monospace">
            {row.company_id?.substring(0, 8)}...
          </Typography>
        </Box>
      ),
    },
  ];

  // Define action buttons
  const actions: ActionButton[] = [
    createActionButton(
      <Trash2 size={16} />,
      "Delete job",
      (row) => setDeleteJobId(row.id),
      "error"
    ),
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Jobs
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Manage job listings and applications
          </Typography>
        </Box>
        <Chip 
          label={`${totalCount} total jobs`} 
          color="primary" 
          variant="outlined"
          sx={{ px: 2, py: 1 }}
        />
      </Box>

      {/* Search Bar */}
      <Box component="form" onSubmit={handleSearch} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search jobs by title or description..."
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
        rows={jobs}
        loading={loading}
        error={error}
        onRetry={fetchJobs}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        actions={actions}
        emptyMessage={searchTerm ? "No jobs found matching your search." : "No jobs have been posted yet."}
        emptyIcon={<Briefcase size={48} color="#9ca3af" />}
        stickyHeader
        maxHeight={600}
      />

      {/* Delete Modal */}
      {deleteJobId && (
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
                Delete Job
              </Typography>
              <IconButton
                onClick={() => setDeleteJobId(null)}
                size="small"
              >
                <X size={20} />
              </IconButton>
            </Box>
            <Typography color="text.secondary" mb={3}>
              Are you sure you want to delete this job? This action cannot be undone.
            </Typography>
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                onClick={() => setDeleteJobId(null)}
                disabled={isDeleting}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleDeleteJob(deleteJobId)}
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
