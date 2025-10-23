# Project Cost Analysis Tool - User Guide

## Overview
This application helps you manage and analyze project costs, comparing different methodologies (Agile, Waterfall, Hybrid) to make data-driven decisions about project management approaches.

## Getting Started

### 1. Installation & Setup
```bash
npm install
npm run dev
```
The application will be available at `http://localhost:5173`

### 2. Authentication
When you first visit the application, you'll see the login page.

#### Sign Up (New Users)
1. Click "Create Account" to switch to registration mode
2. Fill in your details:
   - **Full Name**: Your display name
   - **Email**: Valid email address
   - **Password**: At least 6 characters
3. Click "Create Account"

#### Sign In (Existing Users)
1. Enter your email and password
2. Click "Sign In"

#### Google Authentication
- Click "Continue with Google" to sign in with your Google account
- Authorize the application when prompted

## Main Features

### Dashboard
The dashboard provides an overview of all your projects with key metrics:
- **Total Projects**: Number of projects in your portfolio
- **Average Cost**: Mean cost across all projects
- **Success Rate**: Percentage of completed projects
- **Active Projects**: Currently ongoing projects

### Projects Management

#### Adding a New Project
1. Navigate to the "Projects" tab
2. Click the "+ Add Project" button
3. Fill in the project details:
   - **Project Name**: Descriptive name for your project
   - **Methodology**: Choose from Agile, Waterfall, or Hybrid
   - **Industry**: Select relevant industry sector
   - **Project Size**: Small, Medium, or Large
   - **Team Size**: Number of team members
   - **Start Date**: When the project begins
   - **End Date**: Expected completion date (optional)
   - **Status**: Planning, Active, Completed, or On Hold
   - **Planned Cost**: Budget allocation
   - **Actual Cost**: Real expenditure (can be updated during project)

4. Click "Add Project" to save

#### Editing Projects
1. Find the project in the list
2. Click the "Edit" button (pencil icon)
3. Modify any field as needed
4. Click "Update Project" to save changes

#### Deleting Projects
1. Find the project in the list
2. Click the "Delete" button (trash icon)
3. Confirm deletion in the popup dialog

#### Project Filtering & Search
- Use the search bar to find projects by name
- Filter by:
  - Status (All, Planning, Active, Completed, On Hold)
  - Methodology (All, Agile, Waterfall, Hybrid)
  - Size (All, Small, Medium, Large)

### Analysis & Reporting

#### Running Analysis
1. Navigate to the "Analysis" tab
2. Configure your analysis parameters:
   - **Analysis Name**: Name for this analysis session
   - **Methodologies**: Select which methodologies to compare
   - **Industries**: Filter by specific industries (optional)
   - **Project Sizes**: Include specific sizes (optional)
   - **Date Range**: Analyze projects within a timeframe
   - **Metrics**: Choose what to analyze (Cost, Cost Variance, Rework Cost)
   - **Statistical Test**: T-test or Mann-Whitney U test

3. Click "Run Analysis" to generate results

#### Understanding Analysis Results
The analysis provides:
- **Summary Statistics**: Project counts by methodology
- **Cost Comparisons**: Mean, median, standard deviation for each methodology
- **Statistical Significance**: P-values and effect sizes
- **Recommendations**: Data-driven suggestions based on your projects

#### Exporting Results
- Click "Export to CSV" to download analysis results
- Click "Save Analysis" to store the configuration for future use

### Settings
Access user settings to:
- **Profile**: Update name, email, and password
- **Notifications**: Configure email alerts and in-app notifications
- **Security**: Manage account security settings
- **Preferences**: Customize dashboard layout and default filters

## Sample Data for Testing

### Sample Projects to Add

#### Project 1: E-commerce Platform
- **Name**: Online Store Redesign
- **Methodology**: Agile
- **Industry**: Technology
- **Size**: Large
- **Team Size**: 12
- **Start Date**: 2024-01-15
- **End Date**: 2024-06-30
- **Status**: Completed
- **Planned Cost**: 180000
- **Actual Cost**: 165000

#### Project 2: ERP Implementation
- **Name**: Enterprise Resource Planning
- **Methodology**: Waterfall
- **Industry**: Manufacturing
- **Size**: Large
- **Team Size**: 15
- **Start Date**: 2024-02-01
- **End Date**: 2024-12-31
- **Status**: Active
- **Planned Cost**: 250000
- **Actual Cost**: 180000

#### Project 3: Mobile App Development
- **Name**: Customer Service App
- **Methodology**: Agile
- **Industry**: Healthcare
- **Size**: Medium
- **Team Size**: 8
- **Start Date**: 2024-03-01
- **End Date**: 2024-08-15
- **Status**: Active
- **Planned Cost**: 120000
- **Actual Cost**: 95000

#### Project 4: Data Migration
- **Name**: Legacy System Migration
- **Methodology**: Hybrid
- **Industry**: Financial Services
- **Size**: Medium
- **Team Size**: 6
- **Start Date**: 2024-01-01
- **End Date**: 2024-04-30
- **Status**: Completed
- **Planned Cost**: 85000
- **Actual Cost**: 92000

#### Project 5: Website Redesign
- **Name**: Corporate Website Update
- **Methodology**: Agile
- **Industry**: Marketing
- **Size**: Small
- **Team Size**: 4
- **Start Date**: 2024-04-01
- **End Date**: 2024-06-01
- **Status**: Completed
- **Planned Cost**: 45000
- **Actual Cost**: 38000

### Testing Workflow

1. **Initial Setup**
   - Sign up for a new account or sign in
   - Navigate through all tabs to familiarize yourself with the interface

2. **Add Sample Projects**
   - Add the 5 sample projects listed above
   - Experiment with different combinations of fields
   - Notice how projects persist when switching between tabs

3. **Test Project Management**
   - Edit one of the projects to change its status
   - Delete a test project and confirm it's removed
   - Use the search and filter functions

4. **Run Analysis**
   - Go to Analysis tab
   - Run analysis with default settings
   - Observe the comparison between Agile and Waterfall methodologies
   - Try different filter combinations

5. **Export and Save**
   - Export analysis results to CSV
   - Save analysis configuration for reuse

## Tips for Best Results

### Data Quality
- **Consistent Data Entry**: Use standardized naming conventions
- **Complete Information**: Fill all required fields for accurate analysis
- **Regular Updates**: Keep actual costs updated as projects progress
- **Realistic Estimates**: Ensure planned costs reflect true expectations

### Analysis Best Practices
- **Sufficient Sample Size**: Need at least 3-5 projects per methodology for meaningful comparison
- **Comparable Projects**: Compare similar-sized projects for better insights
- **Historical Data**: Include completed projects for accurate cost analysis
- **Context Consideration**: Consider external factors that might affect costs

### Troubleshooting

#### Common Issues
1. **Projects Not Saving**: Ensure all required fields are filled
2. **Analysis Not Running**: Check that you have sufficient project data
3. **Login Issues**: Verify email/password or try Google authentication
4. **Data Not Persisting**: Projects are automatically saved to browser storage

#### Performance Tips
- **Regular Cleanup**: Remove test or duplicate projects
- **Efficient Filtering**: Use filters to focus on relevant data
- **Export Important Data**: Regularly export analysis results as backup

## Support
If you encounter issues or need assistance:
1. Check this user guide for solutions
2. Verify all required fields are completed
3. Try refreshing the browser
4. Clear browser cache if needed

## Data Privacy
- All project data is stored locally in your browser
- Firebase handles authentication securely
- No sensitive project data is shared externally
- You can delete your account and all data at any time

---

**Version**: 1.0
**Last Updated**: January 2025
