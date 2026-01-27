const express = require('express');
const pool = require('../config/database');
const { authenticateToken, requireManager } = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/daily-summary
// Get daily summary of team activity for managers
router.get('/daily-summary', authenticateToken, requireManager, async (req, res) => {
    try {
        const { date, employee_id } = req.query;

        // Validate required date parameter
        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Date parameter is required (format: YYYY-MM-DD)'
            });
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Use YYYY-MM-DD'
            });
        }

        // Build query for employee breakdown
        let employeeQuery = `
            SELECT 
                u.id as employee_id,
                u.name as employee_name,
                COUNT(ch.id) as checkins_count,
                COUNT(DISTINCT ch.client_id) as unique_clients,
                SUM(
                    CASE 
                        WHEN ch.checkout_time IS NOT NULL 
                        THEN (JULIANDAY(ch.checkout_time) - JULIANDAY(ch.checkin_time)) * 24
                        ELSE 0 
                    END
                ) as working_hours,
                GROUP_CONCAT(DISTINCT c.name) as clients_visited
            FROM users u
            LEFT JOIN checkins ch ON u.id = ch.employee_id 
                AND DATE(ch.checkin_time) = ?
            LEFT JOIN clients c ON ch.client_id = c.id
            WHERE u.manager_id = ?
        `;

        const params = [date, req.user.id];

        // Add employee filter if specified
        if (employee_id) {
            employeeQuery += ` AND u.id = ?`;
            params.push(employee_id);
        }

        employeeQuery += ` GROUP BY u.id, u.name ORDER BY u.name`;

        const [employeeBreakdown] = await pool.execute(employeeQuery, params);

        // Calculate team summary
        const teamSummary = {
            total_checkins: 0,
            total_employees_active: 0,
            total_clients_visited: 0,
            total_working_hours: 0
        };

        const uniqueClients = new Set();

        employeeBreakdown.forEach(emp => {
            teamSummary.total_checkins += emp.checkins_count;
            if (emp.checkins_count > 0) {
                teamSummary.total_employees_active += 1;
            }
            teamSummary.total_working_hours += emp.working_hours || 0;

            if (emp.clients_visited) {
                emp.clients_visited.split(',').forEach(client => uniqueClients.add(client));
            }
        });

        teamSummary.total_clients_visited = uniqueClients.size;
        teamSummary.total_working_hours = Math.round(teamSummary.total_working_hours * 10) / 10;

        // Format employee breakdown
        const formattedEmployees = employeeBreakdown.map(emp => ({
            employee_id: emp.employee_id,
            employee_name: emp.employee_name,
            checkins_count: emp.checkins_count,
            unique_clients: emp.unique_clients,
            working_hours: Math.round((emp.working_hours || 0) * 10) / 10,
            clients_visited: emp.clients_visited ? emp.clients_visited.split(',') : []
        }));

        res.json({
            success: true,
            data: {
                date: date,
                team_summary: teamSummary,
                employee_breakdown: formattedEmployees
            }
        });

    } catch (error) {
        console.error('Daily summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate daily summary'
        });
    }
});

module.exports = router;
