"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Search, CreditCard, Building2, Calendar, CheckCircle2, XCircle, ArrowUp, ArrowDown } from "lucide-react";
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

interface Subscription {
  id: string;
  company_id: string;
  plan_key: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  companies: {
    name: string;
    verified: boolean;
  };
  subscription_plans: {
    name: string;
    price_monthly: number;
    currency: string;
  };
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchSubscriptions();
  }, [page, searchTerm, rowsPerPage]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("company_subscriptions")
        .select(`
          *,
          companies!inner(name, verified),
          subscription_plans!inner(name, price_monthly, currency)
        `, { count: "exact" });

      if (searchTerm) {
        query = query.ilike("companies.name", `%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(page * rowsPerPage, (page + 1) * rowsPerPage - 1);

      if (error) throw error;
      setSubscriptions(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchSubscriptions();
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusChange = async (subscriptionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("company_subscriptions")
        .update({ status: newStatus })
        .eq("id", subscriptionId);

      if (error) throw error;

      setSubscriptions(prev =>
        prev.map(sub =>
          sub.id === subscriptionId ? { ...sub, status: newStatus } : sub
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update subscription");
    }
  };

  // Define table columns
  const columns: Column[] = [
    {
      id: 'companies',
      label: 'Company',
      minWidth: 200,
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
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {row.companies.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.companies.verified ? "Verified" : "Unverified"}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'subscription_plans',
      label: 'Plan',
      minWidth: 150,
      format: (value: any, row: any) => (
        <Box>
          <Typography variant="body2" fontWeight="medium" sx={{ textTransform: 'capitalize' }}>
            {row.subscription_plans.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.plan_key}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      format: (value: any) => createStatusChip(value),
    },
    {
      id: 'current_period_start',
      label: 'Billing Period',
      minWidth: 200,
      format: (value: any, row: any) => (
        <Box>
          {row.current_period_start && row.current_period_end ? (
            <Box display="flex" alignItems="center" gap={0.5}>
              <Calendar size={16} color="#6b7280" />
              <Typography variant="body2">
                {new Date(row.current_period_start).toLocaleDateString()} - {new Date(row.current_period_end).toLocaleDateString()}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No billing period
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'subscription_plans',
      label: 'Price',
      minWidth: 120,
      format: (value: any, row: any) => (
        <Typography variant="body2" fontWeight="medium">
          {row.subscription_plans.currency} {row.subscription_plans.price_monthly}/month
        </Typography>
      ),
    },
    {
      id: 'cancel_at_period_end',
      label: 'Actions',
      minWidth: 150,
      format: (value: any) => (
        value ? (
          <Chip 
            label="Canceling at period end" 
            color="warning" 
            variant="outlined" 
            size="small"
          />
        ) : null
      ),
    },
  ];

  // Define action buttons
  const actions: ActionButton[] = [
    createActionButton(
      row => row.status === 'active' ? <XCircle size={16} /> : <CheckCircle2 size={16} />,
      row => row.status === 'active' ? "Pause subscription" : "Activate subscription",
      (row) => handleStatusChange(row.id, row.status === 'active' ? 'inactive' : 'active'),
      row => row.status === 'active' ? "warning" : "success"
    ),
    createActionButton(
      <ArrowUp size={16} />,
      "Upgrade plan",
      (row) => console.log("Upgrade plan", row.id),
      "info"
    ),
    createActionButton(
      <ArrowDown size={16} />,
      "Downgrade plan",
      (row) => console.log("Downgrade plan", row.id),
      "default"
    ),
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Subscriptions
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Manage company subscription plans and billing
          </Typography>
        </Box>
        <Chip 
          label={`${totalCount} total subscriptions`} 
          color="primary" 
          variant="outlined"
          sx={{ px: 2, py: 1 }}
        />
      </Box>

      {/* Search Bar */}
      <Box component="form" onSubmit={handleSearch} sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by company name..."
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
        rows={subscriptions}
        loading={loading}
        error={error}
        onRetry={fetchSubscriptions}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        actions={actions}
        emptyMessage={searchTerm ? "No subscriptions found matching your search." : "No subscriptions have been created yet."}
        emptyIcon={<CreditCard size={48} color="#9ca3af" />}
        stickyHeader
        maxHeight={600}
      />
    </Box>
  );
}


