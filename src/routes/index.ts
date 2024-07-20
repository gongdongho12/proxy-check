import { Router } from 'express';
import api from 'routes/api';

const router = Router();

router.get("/test", (req, res) => {
	res.send("Hello World!");
});

router.use('/api', api);

export default router;
