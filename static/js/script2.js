// Refinance Table Management JavaScript

// Global variables
let showingAll = false;
let totalRowsCount = 0;
const INITIAL_ROWS_SHOWN = 20;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeTable();
    setupTableObserver();
});

/**
 * Initialize the table functionality
 */
function initializeTable() {
    // Count total rows (excluding header)
    const tableRows = document.querySelectorAll('.table tbody tr');
    totalRowsCount = tableRows.length;
    
    // Update the total count display
    const totalRowsElement = document.getElementById('total-rows');
    if (totalRowsElement) {
        totalRowsElement.textContent = totalRowsCount;
    }
    
    // Update visible rows count
    const visibleRowsElement = document.getElementById('visible-rows');
    if (visibleRowsElement) {
        const visibleCount = Math.min(INITIAL_ROWS_SHOWN, totalRowsCount);
        visibleRowsElement.textContent = visibleCount;
    }
    
    // If there are INITIAL_ROWS_SHOWN or fewer rows, hide the pagination controls
    const showMoreBtn = document.getElementById('show-more-btn');
    const rowCounter = document.querySelector('.row-counter');
    
    if (totalRowsCount <= INITIAL_ROWS_SHOWN) {
        if (showMoreBtn) showMoreBtn.style.display = 'none';
        if (rowCounter) rowCounter.style.display = 'none';
    }
    
    // Add row indices for easier management
    tableRows.forEach((row, index) => {
        row.setAttribute('data-row-index', index + 1);
    });
    
    console.log(`Table initialized with ${totalRowsCount} rows`);
}

/**
 * Show more rows with animation
 */
function showMoreRows() {
    const hiddenRows = document.querySelectorAll('.table tbody tr:nth-child(n+' + (INITIAL_ROWS_SHOWN + 1) + ')');
    const showMoreBtn = document.getElementById('show-more-btn');
    const showLessBtn = document.getElementById('show-less-btn');
    const visibleRowsSpan = document.getElementById('visible-rows');
    
    if (hiddenRows.length === 0) {
        console.log('No hidden rows found');
        return;
    }
    
    // Disable button during animation
    if (showMoreBtn) {
        showMoreBtn.disabled = true;
        showMoreBtn.textContent = 'Loading...';
    }
    
    // Show all hidden rows with staggered animation
    hiddenRows.forEach((row, index) => {
        setTimeout(() => {
            row.classList.add('show-more', 'newly-revealed');
            
            // Remove the animation class after animation completes
            setTimeout(() => {
                row.classList.remove('newly-revealed');
            }, 400);
        }, index * 30); // Reduced stagger time for smoother experience
    });
    
    // Update UI after all animations start
    setTimeout(() => {
        if (visibleRowsSpan) {
            visibleRowsSpan.textContent = totalRowsCount;
        }
        if (showMoreBtn) {
            showMoreBtn.classList.add('hidden');
            showMoreBtn.disabled = false;
            showMoreBtn.textContent = 'Show More Candidates';
        }
        if (showLessBtn) {
            showLessBtn.classList.remove('hidden');
        }
        showingAll = true;
        
        console.log('All rows now visible');
    }, hiddenRows.length * 30 + 100);
}

/**
 * Show less rows (collapse back to initial view)
 */
function showLessRows() {
    const allRows = document.querySelectorAll('.table tbody tr:nth-child(n+' + (INITIAL_ROWS_SHOWN + 1) + ')');
    const showMoreBtn = document.getElementById('show-more-btn');
    const showLessBtn = document.getElementById('show-less-btn');
    const visibleRowsSpan = document.getElementById('visible-rows');
    
    // Disable button during transition
    if (showLessBtn) {
        showLessBtn.disabled = true;
        showLessBtn.textContent = 'Hiding...';
    }
    
    // Hide rows with fade effect
    allRows.forEach((row, index) => {
        setTimeout(() => {
            row.style.opacity = '0';
            row.style.transform = 'translateY(-10px)';
        }, index * 10);
    });
    
    // After fade animation, actually hide the rows
    setTimeout(() => {
        allRows.forEach(row => {
            row.classList.remove('show-more');
            row.style.opacity = '';
            row.style.transform = '';
        });
        
        // Update UI
        if (visibleRowsSpan) {
            visibleRowsSpan.textContent = INITIAL_ROWS_SHOWN;
        }
        if (showLessBtn) {
            showLessBtn.classList.add('hidden');
            showLessBtn.disabled = false;
            showLessBtn.textContent = 'Show Less';
        }
        if (showMoreBtn) {
            showMoreBtn.classList.remove('hidden');
        }
        showingAll = false;
        
        // Smooth scroll back to table top
        const tableElement = document.getElementById('top-100-table');
        if (tableElement) {
            tableElement.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
        
        console.log('Collapsed to show first ' + INITIAL_ROWS_SHOWN + ' rows');
    }, allRows.length * 10 + 200);
}

/**
 * Setup intersection observer for performance optimization
 */
function setupTableObserver() {
    if ('IntersectionObserver' in window) {
        const tableElement = document.getElementById('top-100-table');
        if (!tableElement) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Table is visible, could add lazy loading here if needed
                    console.log('Table is in viewport');
                } else {
                    // Table is not visible
                    console.log('Table is out of viewport');
                }
            });
        }, {
            threshold: 0.1
        });
        
        observer.observe(tableElement);
    }
}

/**
 * Utility function to get current visible row count
 */
function getCurrentVisibleRowCount() {
    const visibleRows = document.querySelectorAll('.table tbody tr:not([style*="display: none"])');
    return visibleRows.length;
}

/**
 * Utility function to highlight a specific row
 */
function highlightRow(rowIndex) {
    const allRows = document.querySelectorAll('.table tbody tr');
    
    // Remove previous highlights
    allRows.forEach(row => {
        row.classList.remove('highlighted');
    });
    
    // Add highlight to specific row
    if (rowIndex > 0 && rowIndex <= allRows.length) {
        const targetRow = allRows[rowIndex - 1];
        if (targetRow) {
            targetRow.classList.add('highlighted');
            
            // Scroll to the highlighted row
            targetRow.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
            
            // Remove highlight after 3 seconds
            setTimeout(() => {
                targetRow.classList.remove('highlighted');
            }, 3000);
        }
    }
}

/**
 * Search functionality for the table
 */
function searchTable(searchTerm) {
    const rows = document.querySelectorAll('.table tbody tr');
    const searchLower = searchTerm.toLowerCase();
    let visibleCount = 0;
    
    rows.forEach(row => {
        const rowText = row.textContent.toLowerCase();
        const shouldShow = rowText.includes(searchLower);
        
        if (shouldShow) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    // Update visible count
    const visibleRowsSpan = document.getElementById('visible-rows');
    if (visibleRowsSpan) {
        visibleRowsSpan.textContent = visibleCount;
    }
    
    // Hide pagination if searching
    const tableControls = document.querySelector('.table-controls');
    if (tableControls) {
        if (searchTerm.length > 0) {
            tableControls.style.display = 'none';
        } else {
            tableControls.style.display = 'block';
            // Reset to initial state
            resetTableView();
        }
    }
    
    console.log(`Search for "${searchTerm}" found ${visibleCount} results`);
}

/**
 * Reset table to initial view
 */
function resetTableView() {
    const allRows = document.querySelectorAll('.table tbody tr');
    const showMoreBtn = document.getElementById('show-more-btn');
    const showLessBtn = document.getElementById('show-less-btn');
    const visibleRowsSpan = document.getElementById('visible-rows');
    
    // Show all rows first
    allRows.forEach(row => {
        row.style.display = '';
        row.classList.remove('show-more', 'newly-revealed', 'highlighted');
    });
    
    // Hide rows beyond initial count
    const rowsToHide = document.querySelectorAll('.table tbody tr:nth-child(n+' + (INITIAL_ROWS_SHOWN + 1) + ')');
    rowsToHide.forEach(row => {
        row.style.display = 'none';
    });
    
    // Reset UI elements
    if (visibleRowsSpan) {
        visibleRowsSpan.textContent = Math.min(INITIAL_ROWS_SHOWN, totalRowsCount);
    }
    
    if (showMoreBtn) {
        showMoreBtn.classList.remove('hidden');
        showMoreBtn.disabled = false;
        showMoreBtn.textContent = 'Show More Candidates';
    }
    
    if (showLessBtn) {
        showLessBtn.classList.add('hidden');
        showLessBtn.disabled = false;
        showLessBtn.textContent = 'Show Less';
    }
    
    showingAll = false;
    
    console.log('Table view reset to initial state');
}

/**
 * Export visible table data to CSV
 */
function exportTableToCSV(filename = 'refinance_candidates.csv') {
    const table = document.querySelector('.table');
    if (!table) {
        console.error('Table not found');
        return;
    }
    
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cols = row.querySelectorAll('td, th');
        const rowData = [];
        
        cols.forEach(col => {
            let data = col.textContent.trim();
            // Escape quotes and wrap in quotes if contains comma
            if (data.includes(',') || data.includes('"')) {
                data = '"' + data.replace(/"/g, '""') + '"';
            }
            rowData.push(data);
        });
        
        csv.push(rowData.join(','));
    });
    
    // Create download link
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    
    console.log('Table exported to CSV: ' + filename);
}

/**
 * Toggle table controls visibility
 */
function toggleTableControls() {
    const controls = document.querySelector('.table-controls');
    if (controls) {
        controls.style.display = controls.style.display === 'none' ? 'block' : 'none';
    }
}

/**
 * Get table statistics
 */
function getTableStats() {
    const stats = {
        totalRows: totalRowsCount,
        visibleRows: getCurrentVisibleRowCount(),
        showingAll: showingAll,
        initialRowsShown: INITIAL_ROWS_SHOWN
    };
    
    console.log('Table Statistics:', stats);
    return stats;
}

/**
 * Keyboard shortcuts
 */
document.addEventListener('keydown', function(event) {
    // Only activate shortcuts when not typing in input fields
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }
    
    switch(event.key) {
        case 'e':
        case 'E':
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                exportTableToCSV();
            }
            break;
        
        case 'm':
        case 'M':
            if (!showingAll && totalRowsCount > INITIAL_ROWS_SHOWN) {
                showMoreRows();
            }
            break;
        
        case 'l':
        case 'L':
            if (showingAll) {
                showLessRows();
            }
            break;
        
        case 'r':
        case 'R':
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                resetTableView();
            }
            break;
    }
});

/**
 * Add loading state management
 */
function showLoadingState(element, originalText) {
    if (element) {
        element.disabled = true;
        element.textContent = 'Loading...';
        element.classList.add('loading');
    }
}

function hideLoadingState(element, originalText) {
    if (element) {
        element.disabled = false;
        element.textContent = originalText;
        element.classList.remove('loading');
    }
}

/**
 * Error handling wrapper
 */
function safeExecute(func, errorMessage = 'An error occurred') {
    try {
        return func();
    } catch (error) {
        console.error(errorMessage + ':', error);
        
        // Show user-friendly error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = errorMessage + '. Please refresh the page and try again.';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc2626;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        document.body.appendChild(errorDiv);
        
        // Remove error message after 5 seconds
        setTimeout(() => {
            if (document.body.contains(errorDiv)) {
                document.body.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// Wrap main functions with error handling
const originalShowMoreRows = showMoreRows;
const originalShowLessRows = showLessRows;

showMoreRows = function() {
    safeExecute(originalShowMoreRows, 'Failed to show more rows');
};

showLessRows = function() {
    safeExecute(originalShowLessRows, 'Failed to show less rows');
};

// Performance monitoring
let performanceMetrics = {
    tableLoadTime: 0,
    animationTimes: []
};

// Measure table load time
const tableLoadStart = performance.now();
window.addEventListener('load', function() {
    performanceMetrics.tableLoadTime = performance.now() - tableLoadStart;
    console.log(`Table loaded in ${performanceMetrics.tableLoadTime.toFixed(2)}ms`);
});

/**
 * Debug function for development
 */
function debugTable() {
    console.log('=== TABLE DEBUG INFO ===');
    console.log('Total rows:', totalRowsCount);
    console.log('Currently showing all:', showingAll);
    console.log('Visible rows:', getCurrentVisibleRowCount());
    console.log('Performance metrics:', performanceMetrics);
    console.log('========================');
}

// Make debug function available globally in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.debugTable = debugTable;
    console.log('Debug mode enabled. Use debugTable() to see table information.');
}