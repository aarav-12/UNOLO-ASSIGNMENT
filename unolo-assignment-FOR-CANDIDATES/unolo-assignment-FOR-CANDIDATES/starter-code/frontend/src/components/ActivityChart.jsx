import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function ActivityChart({ checkins }) {
    const employeeData = {};
    
    checkins.forEach(checkin => {
        const name = checkin.employee_name;
        if (!employeeData[name]) {
            employeeData[name] = { name, checkins: 0 };
        }
        employeeData[name].checkins += 1;
    });

    const chartData = Object.values(employeeData);

    if (chartData.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-500">
                No check-in data to display
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="checkins" fill="#3B82F6" name="Check-ins" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export default ActivityChart;
