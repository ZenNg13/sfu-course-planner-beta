import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /api/courses
// Public: Get a list of all available courses from JSON file
export const getAllCourses = async (req: Request, res: Response) => {
  try {
    // Read the JSON file with 251 courses
    // Path: frontend/src/controllers -> ../../../backend/data
    const jsonPath = path.join(__dirname, '../../../backend/data/fall_2025_courses_with_enrollment.json');
    const rawData = readFileSync(jsonPath, 'utf-8');
    const courses = JSON.parse(rawData);

    res.status(200).json(courses);
  } catch (error) {
    console.error('Get all courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/courses/eligible
// Protected: Get courses the user is allowed to take
export const getEligibleCourses = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Get the user's completed courses
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { completedCourses: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const completedCourses = user.completedCourses;

    // 2. Get ALL courses from the database
    const allCourses = await prisma.course.findMany();

    // 3. Filter: Keep only the courses the user is eligible for
    const eligibleCourses = allCourses.filter((course: any) => {
      
      // Rule 1: If I've already taken it, I don't need to take it again.
      if (completedCourses.includes(course.code)) {
        return false; 
      }

      // Rule 2: Check if I have all the "AND" prerequisites.
      // Every single course in the prerequisites array must be completed.
      const allAndPrerequisitesMet = course.prerequisites.every((prerequisite: string) =>
        completedCourses.includes(prerequisite)
      );

      if (!allAndPrerequisitesMet) {
        return false; // Missing at least one AND prerequisite
      }

      // Rule 3: Check if I satisfy all "OR" prerequisite groups.
      // For each OR group, I need to have completed at least ONE course from that group.
      if (course.prerequisitesOr && course.prerequisitesOr.length > 0) {
        const allOrGroupsMet = course.prerequisitesOr.every((orGroup: string) => {
          // orGroup is a string like "CMPT 125|CMPT 128"
          // Split it into individual course options
          const options = orGroup.split('|');
          
          // Check if at least ONE of these options is in my completed courses
          return options.some((option: string) => completedCourses.includes(option));
        });

        if (!allOrGroupsMet) {
          return false; // Missing at least one OR group requirement
        }
      }

      // If we get here, all requirements are met!
      return true;
    });

    res.status(200).json(eligibleCourses);
  } catch (error) {
    console.error('Get eligible courses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/courses/enrollment/:dept/:number/:section
// Public: Get live enrollment data for a specific course section
export const getLiveEnrollment = async (req: Request, res: Response) => {
  try {
    const { dept, number, section } = req.params;
    const { term = '2025/fall' } = req.query;

    // For now, return data from the JSON file
    // In production, this would fetch from SFU's live API
    const jsonPath = path.join(__dirname, '../../../backend/data/fall_2025_courses_with_enrollment.json');
    const rawData = readFileSync(jsonPath, 'utf-8');
    const courses = JSON.parse(rawData);

    // Find the specific course section
    const courseSection = courses.find((c: any) => 
      c.info?.dept === dept && 
      c.info?.number === number && 
      c.info?.section === section
    );

    if (courseSection && courseSection.enrollmentData) {
      res.status(200).json({
        dept,
        number,
        section,
        enrolled: courseSection.enrollmentData.enrolled || 'N/A',
        waitlist: courseSection.enrollmentData.waitlist || '0',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(404).json({ error: 'Course section not found' });
    }
  } catch (error) {
    console.error('Get live enrollment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/courses/enrollment/batch
// Public: Get live enrollment data for multiple course sections
export const getBatchEnrollment = async (req: Request, res: Response) => {
  try {
    const { courses: coursesToFetch, term = '2025/fall' } = req.body;

    if (!Array.isArray(coursesToFetch)) {
      return res.status(400).json({ error: 'Invalid request: courses must be an array' });
    }

    const jsonPath = path.join(__dirname, '../../../backend/data/fall_2025_courses_with_enrollment.json');
    const rawData = readFileSync(jsonPath, 'utf-8');
    const allCourses = JSON.parse(rawData);

    const results = coursesToFetch.map((course: any) => {
      const { dept, number, section } = course;
      
      const courseSection = allCourses.find((c: any) => 
        c.info?.dept === dept && 
        c.info?.number === number && 
        c.info?.section === section
      );

      if (courseSection && courseSection.enrollmentData) {
        return {
          dept,
          number,
          section,
          enrolled: courseSection.enrollmentData.enrolled || 'N/A',
          waitlist: courseSection.enrollmentData.waitlist || '0',
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          dept,
          number,
          section,
          enrolled: 'N/A',
          waitlist: '0',
          timestamp: new Date().toISOString()
        };
      }
    });

    res.status(200).json(results);
  } catch (error) {
    console.error('Get batch enrollment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};