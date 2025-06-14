import { useState } from 'react'
import { Filter, CalendarDays, Search, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrentProject } from '@/hooks/useCurrentProject'
import { Sidebar } from '@/components/Sidebar'
import { Navbar } from '@/components/Navbar'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Loader } from '@/components/ui/loader'

const MOCK_ISSUES = [
  {
    id: '1',
    title: 'Unnecessary block.',
    file: 'gatsby-node.js',
    reporter: 'PMD',
    timeToFix: '5 minutes',
    createdAt: '2 months ago',
    author: {
      name: 'Jane Doe',
      avatar: '/avatars/jane.jpg'
    },
    code: `const path = require('path')
const { createFilePath } = require('gatsby-source-filesystem')

exports.createPages = async ({ graphql, actions, reporter }) => {
    const { createPage } = actions`,
    explanation:
      'An unnecessary Block is present. Such Blocks are often used in other languages to introduce a new variable scope. Blocks do not behave like this in ECMAScript, and using them can be misleading. Considering removing this unnecessary Block.',
    example: 'if (foo) {\n    // Ok\n}'
  },
  {
    id: '2',
    title: 'Avoid using var keyword',
    file: 'utils.js',
    reporter: 'ESLint',
    timeToFix: '2 minutes',
    createdAt: '3 days ago',
    author: {
      name: 'John Smith',
      avatar: '/avatars/john.jpg'
    },
    code: 'var count = 0;',
    explanation: 'Use const or let instead of var to declare variables.',
    example: 'const count = 0;'
  }
]

export default function CodeIssues() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const { currentProject, isLoading } = useCurrentProject()
  const [expandedIssues, setExpandedIssues] = useState<string[]>([])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const toggleIssue = (issueId: string) => {
    setExpandedIssues((prev) => (prev.includes(issueId) ? prev.filter((id) => id !== issueId) : [...prev, issueId]))
  }

  if (isLoading || !currentProject) {
    return (
      <div className='flex h-screen bg-gray-100'>
        <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
        <div className='flex-1 flex flex-col overflow-hidden'>
          <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <Loader />
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-screen bg-[#fafafa]'>
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className='flex-1 flex flex-col overflow-hidden'>
        <Navbar isSidebarOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className='flex flex-col h-full p-8 overflow-y-auto'>
          <h1 className='text-3xl font-bold text-[#0F172A] mb-6'>Code Issues</h1>

          <div className='flex gap-4 mb-8'>
            <Button variant='outline' className='bg-white border-gray-200 hover:bg-gray-50'>
              <Filter className='h-4 w-4 mr-2' />
              Filter
            </Button>

            <Select defaultValue='today'>
              <SelectTrigger className='w-[140px] bg-white border-gray-200'>
                <CalendarDays className='h-4 w-4 mr-2' />
                <SelectValue placeholder='Today' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='today'>Today</SelectItem>
                <SelectItem value='week'>This Week</SelectItem>
                <SelectItem value='month'>This Month</SelectItem>
              </SelectContent>
            </Select>

            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
              <Input
                placeholder='Search For Issue'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10 bg-white border-gray-200'
              />
            </div>
          </div>

          <div className='space-y-8'>
            {Array.from(new Set(MOCK_ISSUES.map((issue) => issue.file))).map((file) => (
              <div key={file} className='space-y-4'>
                <h2 className='text-lg font-semibold text-[#0F172A]'>{file}</h2>

                {MOCK_ISSUES.filter((issue) => issue.file === file).map((issue) => (
                  <Card key={issue.id} className='border border-gray-200 hover:border-gray-300 transition-colors'>
                    <CardContent className='p-6'>
                      <div
                        className='flex items-center justify-between cursor-pointer'
                        onClick={() => toggleIssue(issue.id)}
                      >
                        <div className='flex-1'>
                          <h3 className='text-lg font-semibold text-[#0F172A] mb-4'>{issue.title}</h3>

                          <div className='flex items-center gap-6 text-sm'>
                            <div className='flex items-center gap-2'>
                              <Avatar className='h-6 w-6'>
                                <AvatarImage src={issue.author.avatar} />
                                <AvatarFallback>{issue.author.name[0]}</AvatarFallback>
                              </Avatar>
                              <span className='text-gray-600'>{issue.author.name}</span>
                            </div>
                            <span className='text-gray-400'>{issue.createdAt}</span>
                            <div className='text-gray-600'>
                              <span>Reported by {issue.reporter}</span>
                              <span className='mx-2'>•</span>
                              <span>Time to fix: {issue.timeToFix}</span>
                            </div>
                          </div>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 text-gray-400 transition-transform ${
                            expandedIssues.includes(issue.id) ? 'transform rotate-180' : ''
                          }`}
                        />
                      </div>

                      {expandedIssues.includes(issue.id) && (
                        <div className='mt-6 pt-6 border-t'>
                          <pre className='bg-gray-50 p-4 rounded-lg overflow-x-auto mb-6'>
                            <code className='text-sm font-mono'>{issue.code}</code>
                          </pre>

                          <div className='text-gray-700'>
                            <h4 className='font-semibold mb-2'>Explanation</h4>
                            <p className='mb-4 text-sm leading-relaxed'>{issue.explanation}</p>

                            <h4 className='font-semibold mb-2'>Example(s):</h4>
                            <pre className='bg-gray-50 p-4 rounded-lg overflow-x-auto'>
                              <code className='text-sm font-mono'>{issue.example}</code>
                            </pre>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
