import consultingRoutes from './consultingRoutes.js';

export default function setupRoutes(app) {
	app.use(consultingRoutes);

	// 기본 라우트
	app.get('/', (req, res) => res.send('Welcome to the Consulting API'));
}
