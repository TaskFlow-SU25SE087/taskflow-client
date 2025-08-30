import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Calendar, Download, FileText } from 'lucide-react'
import React from 'react'

interface ReportExportProps {
  projectName?: string
  onExportPDF?: () => void
  onExportExcel?: () => void
  onExportCSV?: () => void
}

export const ReportExport: React.FC<ReportExportProps> = ({
  projectName = 'Project',
  onExportPDF,
  onExportExcel,
  onExportCSV
}) => {
  const handleExportPDF = () => {
    if (onExportPDF) {
      onExportPDF()
    } else {
      // Default PDF export logic
      console.log('Exporting PDF report...')
      // Here you would implement actual PDF generation
      // For now, we'll just show a message
      alert('PDF export functionality would be implemented here')
    }
  }

  const handleExportExcel = () => {
    if (onExportExcel) {
      onExportExcel()
    } else {
      // Default Excel export logic
      console.log('Exporting Excel report...')
      // Here you would implement actual Excel generation
      alert('Excel export functionality would be implemented here')
    }
  }

  const handleExportCSV = () => {
    if (onExportCSV) {
      onExportCSV()
    } else {
      // Default CSV export logic
      console.log('Exporting CSV report...')
      // Here you would implement actual CSV generation
      alert('CSV export functionality would be implemented here')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Download className="h-5 w-5" />
          <span>Export Report</span>
        </CardTitle>
        <CardDescription>
          Export your project report in various formats
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="flex flex-col items-center space-y-2 h-auto p-4"
            onClick={handleExportPDF}
          >
            <FileText className="h-6 w-6 text-red-500" />
            <div className="text-center">
              <div className="font-medium">PDF Report</div>
              <div className="text-xs text-gray-500">Complete report</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center space-y-2 h-auto p-4"
            onClick={handleExportExcel}
          >
            <BarChart3 className="h-6 w-6 text-green-500" />
            <div className="text-center">
              <div className="font-medium">Excel Report</div>
              <div className="text-xs text-gray-500">Data analysis</div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center space-y-2 h-auto p-4"
            onClick={handleExportCSV}
          >
            <Calendar className="h-6 w-6 text-blue-500" />
            <div className="text-center">
              <div className="font-medium">CSV Data</div>
              <div className="text-xs text-gray-500">Raw data export</div>
            </div>
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          Reports will include all current data for {projectName}
        </div>
      </CardContent>
    </Card>
  )
}

// Utility function to generate CSV content
export const generateCSVContent = (data: any[], headers: string[]) => {
  const csvHeaders = headers.join(',')
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header] || ''
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }).join(',')
  )
  
  return [csvHeaders, ...csvRows].join('\n')
}

// Utility function to download file
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
} 