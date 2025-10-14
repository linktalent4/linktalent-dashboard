"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Button,
  Pagination,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { ChevronLeft, ChevronRight, FirstPage, LastPage } from '@mui/icons-material';

// Styled components for better customization
const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  boxShadow: `0 4px 6px ${alpha(theme.palette.common.black, 0.07)}, 0 1px 3px ${alpha(theme.palette.common.black, 0.1)}`,
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  '& .MuiTable-root': {
    minWidth: 1200, // Increased minimum width to ensure horizontal scroll
  },
  '& .MuiTableHead-root': {
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
    position: 'sticky',
    top: 0,
    zIndex: 10,
    '& .MuiTableCell-head': {
      color: theme.palette.primary.contrastText,
      fontWeight: 700,
      fontSize: '0.875rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      borderBottom: 'none',
      position: 'relative',
      padding: theme.spacing(2),
      backgroundColor: 'transparent',
      textShadow: '0 1px 2px rgba(0,0,0,0.1)',
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.contrastText, 0.1),
        transform: 'translateY(-1px)',
      },
      transition: 'all 0.2s ease-in-out',
    },
  },
  '& .MuiTableCell-body': {
    fontSize: '0.875rem',
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    padding: theme.spacing(1.5, 2),
    verticalAlign: 'top',
  },
  '& .MuiTableRow-root': {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.04),
      transform: 'translateY(-2px)',
      boxShadow: `0 8px 25px ${alpha(theme.palette.common.black, 0.15)}`,
      '& .MuiTableCell-body': {
        borderBottomColor: alpha(theme.palette.primary.main, 0.2),
      },
    },
    '&:nth-of-type(even)': {
      backgroundColor: alpha(theme.palette.grey[50], 0.3),
    },
    '&:nth-of-type(odd)': {
      backgroundColor: theme.palette.background.paper,
    },
  },
}));

const ResizeHandle = styled('div')(({ theme }) => ({
  position: 'absolute',
  right: 0,
  top: 0,
  height: '100%',
  width: '4px',
  cursor: 'col-resize',
  backgroundColor: 'transparent',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.contrastText, 0.3),
  },
  '&:active': {
    backgroundColor: alpha(theme.palette.primary.contrastText, 0.5),
  },
}));

const ModernPagination = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(2, 3),
  backgroundColor: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: `0 0 ${theme.spacing(2)} ${theme.spacing(2)}`,
  boxShadow: `0 -2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  height: 24,
  fontSize: '0.75rem',
  fontWeight: 500,
}));

export interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: any, row?: any) => React.ReactNode;
  sortable?: boolean;
}

export interface ActionButton {
  icon: React.ReactNode;
  tooltip: string;
  onClick: (row: any) => void;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  disabled?: (row: any) => boolean;
}

export interface MaterialTableProps {
  columns: Column[];
  rows: any[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  onPageChange?: (event: unknown, newPage: number) => void;
  onRowsPerPageChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  actions?: ActionButton[];
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  stickyHeader?: boolean;
  maxHeight?: number;
  showPagination?: boolean;
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
}

export default function MaterialTable({
  columns,
  rows,
  loading = false,
  error = null,
  onRetry,
  page = 0,
  rowsPerPage = 10,
  totalCount = 0,
  onPageChange,
  onRowsPerPageChange,
  actions = [],
  emptyMessage = "No data available",
  emptyIcon,
  stickyHeader = false,
  maxHeight,
  showPagination = true,
  searchable = false,
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Search...",
}: MaterialTableProps) {
  const theme = useTheme();
  const tableRef = useRef<HTMLTableElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizingColumn, setResizingColumn] = useState<number | null>(null);
  const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({});

  const handleChangePage = (event: unknown, newPage: number) => {
    onPageChange?.(event, newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange?.(event);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, columnIndex: number) => {
    e.preventDefault();
    setIsResizing(true);
    setResizingColumn(columnIndex);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || resizingColumn === null || !tableRef.current) return;

    const table = tableRef.current;
    const columnElements = table.querySelectorAll(`th:nth-child(${resizingColumn + 1}), td:nth-child(${resizingColumn + 1})`);
    const newWidth = e.clientX - table.getBoundingClientRect().left;
    
    if (newWidth > 100) {
      const columnId = columns[resizingColumn]?.id;
      if (columnId) {
        setColumnWidths(prev => ({
          ...prev,
          [columnId]: newWidth
        }));
      }
    }
  }, [isResizing, resizingColumn, columns]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    setResizingColumn(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const totalPages = Math.ceil(totalCount / rowsPerPage);

  if (loading && rows.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <Box textAlign="center">
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          onRetry && (
            <Button color="inherit" size="small" onClick={onRetry}>
              Retry
            </Button>
          )
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2 }}>
      <StyledTableContainer sx={{ maxHeight: maxHeight, overflowX: 'auto' }}>
        <Table stickyHeader={true} aria-label="material table" ref={tableRef} sx={{ minWidth: '100%' }}>
          <TableHead>
            <TableRow>
              {columns.map((column, index) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ 
                    minWidth: columnWidths[column.id] || column.minWidth || 150,
                    width: columnWidths[column.id] || column.minWidth || 150,
                    position: 'relative',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {column.label}
                  <ResizeHandle
                    onMouseDown={(e) => handleMouseDown(e, index)}
                  />
                </TableCell>
              ))}
              {actions.length > 0 && (
                <TableCell align="right" style={{ 
                  minWidth: 120, 
                  position: 'relative',
                  whiteSpace: 'nowrap'
                }}>
                  Actions
                  <ResizeHandle
                    onMouseDown={(e) => handleMouseDown(e, columns.length)}
                  />
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (actions.length > 0 ? 1 : 0)} align="center">
                  <Box py={6} textAlign="center">
                    {emptyIcon && (
                      <Box mb={2}>
                        {emptyIcon}
                      </Box>
                    )}
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {emptyMessage}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow hover key={row.id || index}>
                  {columns.map((column) => {
                    const value = row[column.id];
                    return (
                      <TableCell 
                        key={column.id} 
                        align={column.align}
                        style={{ 
                          width: columnWidths[column.id] || column.minWidth || 150,
                          minWidth: columnWidths[column.id] || column.minWidth || 150,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {column.format ? column.format(value, row) : value}
                      </TableCell>
                    );
                  })}
                  {actions.length > 0 && (
                    <TableCell 
                      align="right"
                      style={{ 
                        width: columnWidths[`actions`] || 120,
                        minWidth: columnWidths[`actions`] || 120,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <Box display="flex" gap={0.5} justifyContent="flex-end">
                        {actions.map((action, actionIndex) => {
                          const isDisabled = action.disabled ? action.disabled(row) : false;
                          return (
                            <Tooltip key={actionIndex} title={action.tooltip}>
                              <span>
                                <IconButton
                                  size="small"
                                  color={action.color || 'primary'}
                                  onClick={() => action.onClick(row)}
                                  disabled={isDisabled}
                                  sx={{
                                    '&:hover': {
                                      backgroundColor: alpha(theme.palette[action.color || 'primary'].main, 0.1),
                                      transform: 'scale(1.1)',
                                    },
                                    transition: 'all 0.2s ease-in-out',
                                  }}
                                >
                                  {action.icon}
                                </IconButton>
                              </span>
                            </Tooltip>
                          );
                        })}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </StyledTableContainer>
      
      {showPagination && totalCount > 0 && (
        <ModernPagination>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Typography variant="body2" color="text.secondary">
              Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, totalCount)} of {totalCount} entries
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="body2" color="text.secondary">
                Rows per page:
              </Typography>
              <select
                value={rowsPerPage}
                onChange={handleChangeRowsPerPage}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: `1px solid ${theme.palette.divider}`,
                  backgroundColor: theme.palette.background.paper,
                  fontSize: '0.875rem',
                }}
              >
                {[5, 10, 25, 50, 100].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <IconButton
              onClick={() => handleChangePage(null, 0)}
              disabled={page === 0}
              size="small"
              sx={{ 
                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) },
                transition: 'all 0.2s ease-in-out',
              }}
              title="First page"
            >
              <FirstPage />
            </IconButton>
            <IconButton
              onClick={() => handleChangePage(null, page - 1)}
              disabled={page === 0}
              size="small"
              sx={{ 
                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) },
                transition: 'all 0.2s ease-in-out',
              }}
              title="Previous page"
            >
              <ChevronLeft />
            </IconButton>
            
            <Pagination
              count={totalPages}
              page={page + 1}
              onChange={(event, value) => handleChangePage(event, value - 1)}
              color="primary"
              size="small"
              showFirstButton={false}
              showLastButton={false}
              siblingCount={1}
              boundaryCount={1}
              sx={{
                '& .MuiPaginationItem-root': {
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.2s ease-in-out',
                },
                '& .Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                },
              }}
            />
            
            <IconButton
              onClick={() => handleChangePage(null, page + 1)}
              disabled={page >= totalPages - 1}
              size="small"
              sx={{ 
                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) },
                transition: 'all 0.2s ease-in-out',
              }}
              title="Next page"
            >
              <ChevronRight />
            </IconButton>
            <IconButton
              onClick={() => handleChangePage(null, totalPages - 1)}
              disabled={page >= totalPages - 1}
              size="small"
              sx={{ 
                '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1) },
                transition: 'all 0.2s ease-in-out',
              }}
              title="Last page"
            >
              <LastPage />
            </IconButton>
          </Box>
        </ModernPagination>
      )}
    </Paper>
  );
}

// Helper function to create status chips
export const createStatusChip = (status: string, variant: 'filled' | 'outlined' = 'filled') => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'published':
      case 'verified':
      case 'complete':
        return 'success';
      case 'inactive':
      case 'draft':
      case 'pending':
      case 'incomplete':
        return 'warning';
      case 'canceled':
      case 'rejected':
        return 'error';
      case 'trialing':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <StyledChip
      label={status}
      color={getStatusColor(status)}
      variant={variant}
      size="small"
    />
  );
};

// Helper function to create action buttons
export const createActionButton = (
  icon: React.ReactNode,
  tooltip: string,
  onClick: (row: any) => void,
  color: ActionButton['color'] = 'primary',
  disabled?: (row: any) => boolean
): ActionButton => ({
  icon,
  tooltip,
  onClick,
  color,
  disabled,
});
