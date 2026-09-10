import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import interviewController from '../controller/interview.controller.js';



const {
    generateInterviewReportController,
    generateInterviewReportByIdcontroller,
    generateAllInterviewReportsController
} = interviewController;import upload from '../middleware/file.middleware.js';


const interviewRouter = express.Router();
/*
* @route POST api/interview/
* @description generate new interview report on the basis of user self description,resume,pdf and job description
* @access Private
*/
interviewRouter.post('/', authMiddleware.authUser, upload.single("resume"), generateInterviewReportController)

/*
* @route GET api/interview/report/:interviewId
* @description get interview report by individual id 
* @access Private
*/

interviewRouter.get('/report/:interviewId', authMiddleware.authUser, generateInterviewReportByIdcontroller)

/*
* @route GET api/interview/report/:interviewId
* @description get all interview report 
* @access Private
*/

interviewRouter.get('/', authMiddleware.authUser, generateAllInterviewReportsController)
/*
* @route POST api/interview/resume/pdf/:interviewReportId
* @description generate resume PDF
* @access Private
*/

interviewRouter.post('/resume/pdf/:interviewReportId', authMiddleware.authUser, interviewController.generateResumePdfController)



export default interviewRouter;