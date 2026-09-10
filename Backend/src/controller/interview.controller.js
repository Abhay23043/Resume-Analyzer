import * as pdfParseModule from 'pdf-parse'
import mammoth from 'mammoth'

import generateReportfunctions from '../services/ai.service.js'
import interviewReportmodel from '../models/interviewReport.model.js'


const {
    generateInterviewReport,
    generateResumePdf
} = generateReportfunctions


// ======================================================
// Extract Resume Text
// ======================================================

async function extractResumeText(file) {

    const mimeType = file.mimetype || ''
    const fileName = file.originalname || ''

    // ==================================================
    // PDF
    // ==================================================

    if (
        mimeType === 'application/pdf' ||
        fileName.toLowerCase().endsWith('.pdf')
    ) {

        console.log('=================================')
        console.log('📄 PDF FILE DETECTED')
        console.log('📄 File name:', fileName)
        console.log('📄 MIME type:', mimeType)
        console.log('📄 Buffer size:', file.buffer?.length)
        console.log('=================================')


        try {

            // ==================================================
            // New pdf-parse API
            // ==================================================

            if (typeof pdfParseModule.PDFParse === 'function') {

                console.log('✅ Using new PDFParse API')


                const parser = new pdfParseModule.PDFParse({
                    data: file.buffer
                })


                try {

                    const result = await parser.getText()


                    console.log(
                        '✅ PDF TEXT EXTRACTED'
                    )

                    console.log(
                        '📄 Text length:',
                        result.text?.length
                    )


                    return result.text || ''

                } finally {

                    await parser.destroy()
                }
            }


            // ==================================================
            // Old pdf-parse API
            // ==================================================

            const oldPdfParse =
                pdfParseModule.default ||
                pdfParseModule


            if (typeof oldPdfParse === 'function') {

                console.log(
                    '✅ Using old pdfParse API'
                )


                const result =
                    await oldPdfParse(file.buffer)


                console.log(
                    '✅ PDF TEXT EXTRACTED'
                )

                console.log(
                    '📄 Text length:',
                    result.text?.length
                )


                return result.text || ''
            }


            // ==================================================
            // PDF parser not found
            // ==================================================

            console.log(
                '❌ pdf-parse module:',
                pdfParseModule
            )


            throw new Error(
                'Unable to find a valid pdf-parse API. Please check your installed pdf-parse version.'
            )

        } catch (error) {

            console.error(
                '🔥 PDF EXTRACTION ERROR:',
                error
            )

            throw error
        }
    }


    // ==================================================
    // DOCX
    // ==================================================

    if (
        mimeType ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileName.toLowerCase().endsWith('.docx')
    ) {

        console.log('📄 DOCX FILE DETECTED')


        try {

            const result =
                await mammoth.extractRawText({
                    buffer: file.buffer
                })


            console.log(
                '✅ DOCX TEXT EXTRACTED'
            )


            console.log(
                '📄 Text length:',
                result.value?.length
            )


            return result.value || ''

        } catch (error) {

            console.error(
                '🔥 DOCX EXTRACTION ERROR:',
                error
            )

            throw error
        }
    }


    // ==================================================
    // Unsupported File
    // ==================================================

    throw new Error(
        'Unsupported resume file type. Please upload PDF or DOCX.'
    )
}


// ======================================================
// Generate Interview Report
// ======================================================

/**
 * @description
 * Generate interview report based on resume,
 * self description and job description.
 */

async function generateInterviewReportController(req, res) {

    try {

        console.log(
            '🚀 Generate Interview Report API called'
        )


        // ==================================================
        // 1. Check File
        // ==================================================

        if (!req.file) {

            return res.status(400).json({

                message:
                    'Resume file is required'
            })
        }


        // ==================================================
        // 2. Extract Resume Text
        // ==================================================

        const resumeText =
            await extractResumeText(req.file)


        console.log(
            '📄 Resume text length:',
            resumeText.length
        )


        // ==================================================
        // 3. Get Frontend Data
        // ==================================================

        const {
            selfDescription,
            jobDescription
        } = req.body


        console.log(
            '📝 Self Description:',
            selfDescription
        )

        console.log(
            '💼 Job Description:',
            jobDescription
        )


        // ==================================================
        // 4. Generate AI Report
        // ==================================================

        console.log(
            '🤖 Generating interview report using AI...'
        )


        const interviewReportBYAI =
            await generateInterviewReport({

                resume: resumeText,

                selfDescription,

                jobDescription
            })


        console.log(
            '✅ AI interview report generated'
        )


        // ==================================================
        // 5. Save To MongoDB
        // ==================================================

        const interviewReport =
            await interviewReportmodel.create({

                user: req.user.id,

                resume: resumeText,

                selfDescription,

                jobDescription,

                ...interviewReportBYAI
            })


        console.log(
            '✅ Interview report saved in MongoDB'
        )


        // ==================================================
        // 6. Send Response
        // ==================================================

        return res.status(201).json({

            message:
                'Interview report generated successfully',

            interviewReport
        })

    } catch (err) {

        console.error(
            '🔥 GENERATE REPORT ERROR:',
            err
        )


        return res.status(500).json({

            message:
                `Failed to generate interview report: ${err.message}`
        })
    }
}


// ======================================================
// Get Interview Report By ID
// ======================================================

/**
 * @description
 * Get a single interview report by ID.
 */

async function generateInterviewReportByIdcontroller(req, res) {

    try {

        const {
            interviewId
        } = req.params


        const interviewReport =
            await interviewReportmodel.findOne({

                _id: interviewId,

                user: req.user.id
            })


        if (!interviewReport) {

            return res.status(404).json({

                message:
                    'Interview report not found'
            })
        }


        return res.status(200).json({

            message:
                'Interview report fetched successfully',

            interviewReport
        })

    } catch (err) {

        console.error(
            '🔥 GET REPORT ERROR:',
            err
        )


        return res.status(500).json({

            message:
                `Failed to fetch interview report: ${err.message}`
        })
    }
}


// ======================================================
// Get All Interview Reports
// ======================================================

/**
 * @description
 * Get all interview reports of logged-in user.
 */

async function generateAllInterviewReportsController(req, res) {

    try {

        const interviewReports =
            await interviewReportmodel

                .find({
                    user: req.user.id
                })

                .sort({
                    createdAt: -1
                })

                .select(
                    '-resume -selfDescription -__v'
                )


        return res.status(200).json({

            message:
                'Interview reports fetched successfully',

            interviewReports
        })

    } catch (err) {

        console.error(
            '🔥 GET ALL REPORTS ERROR:',
            err
        )


        return res.status(500).json({

            message:
                `Failed to fetch interview reports: ${err.message}`
        })
    }
}


// ======================================================
// Generate Resume PDF
// ======================================================

/**
 * @description
 * Generate resume PDF from resume content.
 */

async function generateResumePdfController(req, res) {

    try {

        const {
            interviewReportId
        } = req.params


        // ==================================================
        // Find Report
        // ==================================================

        const interviewReport =
            await interviewReportmodel.findOne({

                _id: interviewReportId,

                user: req.user.id
            })


        if (!interviewReport) {

            return res.status(404).json({

                message:
                    'Interview report not found'
            })
        }


        // ==================================================
        // Generate PDF
        // ==================================================

        const pdfBuffer =
            await generateResumePdf({

                resume:
                    interviewReport.resume,

                selfDescription:
                    interviewReport.selfDescription,

                jobDescription:
                    interviewReport.jobDescription
            })


        // ==================================================
        // PDF Headers
        // ==================================================

        res.set({

            'Content-Type':
                'application/pdf',

            'Content-Disposition':
                `attachment; filename=interview_report_${interviewReportId}.pdf`
        })


        // ==================================================
        // Send PDF
        // ==================================================

        return res.send(pdfBuffer)

    } catch (err) {

        console.error(
            '🔥 RESUME PDF ERROR:',
            err
        )


        return res.status(500).json({

            message:
                `Failed to generate resume PDF: ${err.message}`
        })
    }
}


// ======================================================
// Export
// ======================================================

export default {

    generateInterviewReportController,

    generateInterviewReportByIdcontroller,

    generateAllInterviewReportsController,

    generateResumePdfController

}