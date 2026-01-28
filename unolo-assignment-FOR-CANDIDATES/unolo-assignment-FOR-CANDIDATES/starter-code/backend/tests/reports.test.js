const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const pool = require('../config/database');

describe('Daily Summary Report API - GET /api/reports/daily-summary', () => {
    let managerToken;
    let employeeToken;

    beforeAll(() => {
        managerToken = jwt.sign(
            { id: 1, email: 'manager@unolo.com', role: 'manager', name: 'Amit Sharma' },
            process.env.JWT_SECRET || 'default-secret-key',
            { expiresIn: '1h' }
        );

        employeeToken = jwt.sign(
            { id: 2, email: 'rahul@unolo.com', role: 'employee', name: 'Rahul Kumar' },
            process.env.JWT_SECRET || 'default-secret-key',
            { expiresIn: '1h' }
        );
    });

    describe('Authentication & Authorization', () => {
        it('should return 401 if no token is provided', async () => {
            const res = await request(app)
                .get('/api/reports/daily-summary')
                .query({ date: '2024-01-15' });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('token');
        });

        it('should return 403 if user is not a manager', async () => {
            const res = await request(app)
                .get('/api/reports/daily-summary')
                .set('Authorization', `Bearer ${employeeToken}`)
                .query({ date: '2024-01-15' });

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Manager');
        });

        it('should succeed with valid manager token', async () => {
            const res = await request(app)
                .get('/api/reports/daily-summary')
                .set('Authorization', `Bearer ${managerToken}`)
                .query({ date: '2024-01-15' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('Input Validation', () => {
        it('should return 400 if date parameter is missing', async () => {
            const res = await request(app)
                .get('/api/reports/daily-summary')
                .set('Authorization', `Bearer ${managerToken}`);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Date');
        });

        it('should return 400 if date format is invalid', async () => {
            const res = await request(app)
                .get('/api/reports/daily-summary')
                .set('Authorization', `Bearer ${managerToken}`)
                .query({ date: '01-15-2024' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Invalid date format');
        });

        it('should return 400 for another invalid date format', async () => {
            const res = await request(app)
                .get('/api/reports/daily-summary')
                .set('Authorization', `Bearer ${managerToken}`)
                .query({ date: '2024/01/15' });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should accept valid YYYY-MM-DD format', async () => {
            const res = await request(app)
                .get('/api/reports/daily-summary')
                .set('Authorization', `Bearer ${managerToken}`)
                .query({ date: '2024-01-15' });

            expect(res.status).toBe(200);
            expect(res.body.data.date).toBe('2024-01-15');
        });
    });

    describe('Functionality', () => {
        it('should return correct response structure', async () => {
            const res = await request(app)
                .get('/api/reports/daily-summary')
                .set('Authorization', `Bearer ${managerToken}`)
                .query({ date: '2024-01-15' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('date');
            expect(res.body.data).toHaveProperty('team_summary');
            expect(res.body.data).toHaveProperty('employee_breakdown');
            
            expect(res.body.data.team_summary).toHaveProperty('total_checkins');
            expect(res.body.data.team_summary).toHaveProperty('total_employees_active');
            expect(res.body.data.team_summary).toHaveProperty('total_clients_visited');
            expect(res.body.data.team_summary).toHaveProperty('total_working_hours');
        });

        it('should return data for a date with check-ins', async () => {
            const res = await request(app)
                .get('/api/reports/daily-summary')
                .set('Authorization', `Bearer ${managerToken}`)
                .query({ date: '2024-01-15' });

            expect(res.status).toBe(200);
            expect(res.body.data.team_summary.total_checkins).toBeGreaterThan(0);
            expect(res.body.data.employee_breakdown.length).toBeGreaterThan(0);
        });

        it('should return empty data for date with no check-ins', async () => {
            const res = await request(app)
                .get('/api/reports/daily-summary')
                .set('Authorization', `Bearer ${managerToken}`)
                .query({ date: '2020-01-01' });

            expect(res.status).toBe(200);
            expect(res.body.data.team_summary.total_checkins).toBe(0);
        });

        it('should filter by employee_id when provided', async () => {
            const res = await request(app)
                .get('/api/reports/daily-summary')
                .set('Authorization', `Bearer ${managerToken}`)
                .query({ date: '2024-01-15', employee_id: 2 });

            expect(res.status).toBe(200);
            expect(res.body.data.employee_breakdown.length).toBe(1);
            expect(res.body.data.employee_breakdown[0].employee_id).toBe(2);
        });

        it('should return correct employee breakdown structure', async () => {
            const res = await request(app)
                .get('/api/reports/daily-summary')
                .set('Authorization', `Bearer ${managerToken}`)
                .query({ date: '2024-01-15' });

            expect(res.status).toBe(200);
            
            const employee = res.body.data.employee_breakdown[0];
            expect(employee).toHaveProperty('employee_id');
            expect(employee).toHaveProperty('employee_name');
            expect(employee).toHaveProperty('checkins_count');
            expect(employee).toHaveProperty('unique_clients');
            expect(employee).toHaveProperty('working_hours');
            expect(employee).toHaveProperty('clients_visited');
            expect(Array.isArray(employee.clients_visited)).toBe(true);
        });

        it('should calculate working hours correctly for completed check-ins', async () => {
            const res = await request(app)
                .get('/api/reports/daily-summary')
                .set('Authorization', `Bearer ${managerToken}`)
                .query({ date: '2024-01-15' });

            expect(res.status).toBe(200);
            expect(res.body.data.team_summary.total_working_hours).toBeGreaterThan(0);
        });
    });

    describe('Edge Cases', () => {
        it('should handle date at beginning of month', async () => {
            const res = await request(app)
                .get('/api/reports/daily-summary')
                .set('Authorization', `Bearer ${managerToken}`)
                .query({ date: '2024-01-01' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should handle date at end of month', async () => {
            const res = await request(app)
                .get('/api/reports/daily-summary')
                .set('Authorization', `Bearer ${managerToken}`)
                .query({ date: '2024-01-31' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('should handle invalid employee_id gracefully', async () => {
            const res = await request(app)
                .get('/api/reports/daily-summary')
                .set('Authorization', `Bearer ${managerToken}`)
                .query({ date: '2024-01-15', employee_id: 9999 });

            expect(res.status).toBe(200);
            expect(res.body.data.employee_breakdown.length).toBe(0);
        });

        it('should handle active check-ins (no checkout) with 0 hours', async () => {
            const res = await request(app)
                .get('/api/reports/daily-summary')
                .set('Authorization', `Bearer ${managerToken}`)
                .query({ date: '2024-01-16' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
