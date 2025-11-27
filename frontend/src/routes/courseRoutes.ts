import { Router } from 'express';
import { getAllCourses, getEligibleCourses, getLiveEnrollment, getBatchEnrollment } from '../controllers/courseController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Public route: Anyone can see the course catalog
router.get('/all', getAllCourses);  // Changed from '/' to '/all'
router.get('/', getAllCourses);

// Public routes: Enrollment data
router.get('/enrollment/:dept/:number/:section', getLiveEnrollment);
router.post('/enrollment/batch', getBatchEnrollment);

// Protected route: Only logged-in users can see their eligibility
router.get('/eligible', authenticateToken, getEligibleCourses);

export default router;