import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
    ArrowRight,
    Bell,
    Calendar,
    CheckSquare,
    FolderKanban,
    GitBranch,
    Play,
    Search,
    X
} from 'lucide-react'
import React, { useState } from 'react'
import { TutorialImage } from './TutorialImage'

interface TutorialModalProps {
  isOpen: boolean
  onClose: () => void
}

interface TutorialStep {
  title: string
  description: string
  icon: React.ReactNode
  image?: string
  features: string[]
  tips?: string[]
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Global Search",
    description: "Quickly search for anything in the application",
    icon: <Search className="h-6 w-6 text-blue-600" />,
    image: "/tutorial/search-demo.png",
    features: [
      "Search projects by name and description",
      "Search tasks in the current project",
      "Search sprints and development cycles",
      "Real-time results as you type"
    ],
    tips: [
      "Type keywords to search instantly",
      "Click on results to navigate to the corresponding page",
      "Use arrow keys to navigate between results"
    ]
  },
  {
    title: "Project Management",
    description: "Create and manage your projects",
    icon: <FolderKanban className="h-6 w-6 text-green-600" />,
    image: "/tutorial/project-demo.png",
    features: [
      "Create new projects with detailed information",
      "View list of all projects",
      "Switch between projects quickly",
      "Manage members and access permissions"
    ],
    tips: [
      "Use the Projects dropdown to switch between projects",
      "Click 'Create new project' to create a new project",
      "Each project has its own board, backlog, and timeline"
    ]
  },
  {
    title: "Task Management",
    description: "Create and track tasks within projects",
    icon: <CheckSquare className="h-6 w-6 text-purple-600" />,
    image: "/tutorial/task-demo.png",
    features: [
      "Create tasks with title and description",
      "Assign tasks to team members",
      "Track status and progress",
      "Sort tasks by priority and deadline"
    ],
    tips: [
      "Use drag & drop to move tasks between columns",
      "Click on tasks to view details and edit",
      "Use filters to find specific tasks"
    ]
  },
  {
    title: "Sprint Management",
    description: "Plan and track sprints",
    icon: <Calendar className="h-6 w-6 text-orange-600" />,
    image: "/tutorial/sprint-demo.png",
    features: [
      "Create sprints with specific timeframes",
      "Add tasks to sprints",
      "Track velocity and burndown charts",
      "Manage sprint meetings"
    ],
    tips: [
      "Sprints help break down work into manageable phases",
      "Use the backlog to plan sprints",
      "Track sprint progress through the board"
    ]
  },
  {
    title: "GitHub Integration",
    description: "Connect with GitHub to manage code",
    icon: <GitBranch className="h-6 w-6 text-gray-800" />,
    image: "/tutorial/github-demo.png",
    features: [
      "Connect GitHub repositories",
      "Sync issues and pull requests",
      "Track commits and code quality",
      "Manage Git members"
    ],
    tips: [
      "You need repository access permissions to connect",
      "GitHub issues will appear in your project",
      "Monitor code quality through the dashboard"
    ]
  },
  {
    title: "Notifications & Settings",
    description: "Manage notifications and personal settings",
    icon: <Bell className="h-6 w-6 text-red-600" />,
    image: "/tutorial/notifications-demo.png",
    features: [
      "Receive real-time notifications",
      "Set up profile and avatar",
      "Manage access permissions",
      "Customize interface"
    ],
    tips: [
      "Click the bell icon to view notifications",
      "Use the profile dropdown to access settings",
      "Admins can access the admin panel"
    ]
  }
]

export function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const resetTutorial = () => {
    setCurrentStep(0)
  }

  const currentTutorial = tutorialSteps[currentStep]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-blue-600" />
              TaskFlow User Guide
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
              />
            </div>
            <span className="text-sm text-gray-600">
              {currentStep + 1} / {tutorialSteps.length}
            </span>
          </div>

          {/* Current Step */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {currentTutorial.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {currentTutorial.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {currentTutorial.description}
                </p>

                {/* Tutorial Image */}
                {currentTutorial.image && (
                  <div className="mb-6">
                    <TutorialImage 
                      imagePath={currentTutorial.image}
                      title={currentTutorial.title}
                      fallback={true}
                    />
                  </div>
                )}

                {/* Features */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Key Features:</h4>
                  <ul className="space-y-2">
                    {currentTutorial.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tips */}
                {currentTutorial.tips && (
                  <div className="mt-4 space-y-3">
                    <h4 className="font-medium text-gray-900">Usage Tips:</h4>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <ul className="space-y-2">
                        {currentTutorial.tips.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span className="text-blue-800 text-sm">{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={resetTutorial}
                className="text-sm"
              >
                Restart
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              
              {currentStep === tutorialSteps.length - 1 ? (
                <Button onClick={onClose}>
                  Complete
                </Button>
              ) : (
                <Button onClick={nextStep}>
                  Next
                </Button>
              )}
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="flex items-center justify-center gap-1">
            {tutorialSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 