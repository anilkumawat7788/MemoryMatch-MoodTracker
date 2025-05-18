"use client"

import { useState, useEffect, useCallback } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, ChevronRight, BarChart, CalendarIcon, Download } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Sparkles, Trophy, Timer } from "lucide-react"
import confetti from "canvas-confetti"

// Game card icons
const icons = ["🍎", "🍌", "🍇", "🍊", "🍓", "🍉", "🍒", "🥝", "🥑", "🍍", "🍑", "🍋", "🥥", "🍈", "🍐", "🥭"]

// Mood types and colors
const moods = [
  { value: "amazing", label: "Amazing", emoji: "😄", color: "#4ade80", score: 5 },
  { value: "good", label: "Good", emoji: "🙂", color: "#60a5fa", score: 4 },
  { value: "okay", label: "Okay", emoji: "😐", color: "#a78bfa", score: 3 },
  { value: "bad", label: "Bad", emoji: "😔", color: "#f97316", score: 2 },
  { value: "awful", label: "Awful", emoji: "😢", color: "#f43f5e", score: 1 },
]

// Tags for mood entries
const moodTags = ["Work", "Family", "Friends", "Health", "Hobbies", "Sleep", "Exercise", "Food", "Weather", "Travel"]

type MemoryCard = {
  id: number
  icon: string
  flipped: boolean
  matched: boolean
}

type MoodEntry = {
  date: Date
  mood: string
  note: string
  tags: string[]
}

export default function App() {
  const [cards, setCards] = useState<MemoryCard[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [matchedPairs, setMatchedPairs] = useState<number>(0)
  const [moves, setMoves] = useState<number>(0)
  const [gameStarted, setGameStarted] = useState<boolean>(false)
  const [gameWon, setGameWon] = useState<boolean>(false)
  const [level, setLevel] = useState<number>(1)
  const [timer, setTimer] = useState<number>(0)
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false)
  const [bestScore, setBestScore] = useState<number | null>(null)
  // Remove or comment out these unused variables
  // const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)
  const [currentMood, setCurrentMood] = useState<string>("")
  const [currentNote, setCurrentNote] = useState<string>("")
  const [currentTags, setCurrentTags] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>("memory-game")
  const [moodTab, setMoodTab] = useState<string>("calendar")

  // Calculate number of pairs based on level
  const getPairsForLevel = (level: number) => {
    return Math.min(4 + level, 16)
  }

  // Initialize game
  const initializeGame = () => {
    const numPairs = getPairsForLevel(level)
    const selectedIcons = icons.slice(0, numPairs)

    // Create pairs of cards
    let newCards: MemoryCard[] = []
    selectedIcons.forEach((icon, index) => {
      newCards.push({ id: index * 2, icon, flipped: false, matched: false })
      newCards.push({ id: index * 2 + 1, icon, flipped: false, matched: false })
    })

    // Shuffle cards
    newCards = newCards.sort(() => Math.random() - 0.5)

    setCards(newCards)
    setFlippedCards([])
    setMatchedPairs(0)
    setMoves(0)
    setGameWon(false)
    setTimer(0)
    setIsTimerRunning(true)
    setGameStarted(true)
  }

  // Handle card click
  const handleCardClick = (id: number) => {
    // Ignore if two cards are already flipped or this card is already flipped/matched
    const card = cards.find((card) => card.id === id)
    if (flippedCards.length === 2 || flippedCards.includes(id) || card?.matched) return

    // Add card to flipped cards
    const newFlippedCards = [...flippedCards, id]
    setFlippedCards(newFlippedCards)

    // Update cards state
    setCards(cards.map((card) => (card.id === id ? { ...card, flipped: true } : card)))

    // Check for match if two cards are flipped
    if (newFlippedCards.length === 2) {
      setMoves(moves + 1)

      const firstCard = cards.find((card) => card.id === newFlippedCards[0])
      const secondCard = cards.find((card) => card.id === newFlippedCards[1])

      if (firstCard?.icon === secondCard?.icon) {
        // Match found
        setTimeout(() => {
          setCards(
            cards.map((card) =>
              card.id === newFlippedCards[0] || card.id === newFlippedCards[1] ? { ...card, matched: true } : card,
            ),
          )
          setFlippedCards([])
          setMatchedPairs(matchedPairs + 1)
        }, 500)
      } else {
        // No match
        setTimeout(() => {
          setCards(
            cards.map((card) =>
              card.id === newFlippedCards[0] || card.id === newFlippedCards[1] ? { ...card, flipped: false } : card,
            ),
          )
          setFlippedCards([])
        }, 1000)
      }
    }
  }



  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer((prevTimer) => prevTimer + 1)
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isTimerRunning])

  // Calculate score based on moves, time and level
  const calculateScore = useCallback(() => {
    const baseScore = 1000
    const timeDeduction = timer * 2
    const moveDeduction = moves * 10
    const levelBonus = level * 200

    return Math.max(baseScore - timeDeduction - moveDeduction + levelBonus, 0)
  }, [timer, moves, level])

    // Check for win condition
    useEffect(() => {
      if (gameStarted && matchedPairs === getPairsForLevel(level)) {
        setGameWon(true)
        setIsTimerRunning(false)
  
        // Update best score
        const score = calculateScore()
        if (bestScore === null || score > bestScore) {
          setBestScore(score)
        }
  
        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })
      }
    }, [matchedPairs, level, gameStarted, bestScore, calculateScore]) // Make sure calculateScore is included here
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Level up
  const handleLevelUp = () => {
    setLevel(level + 1)
    initializeGame()
  }

  // Restart game
  const handleRestart = () => {
    initializeGame()
  }

  // Start new game
  const handleStartGame = () => {
    initializeGame()
  }

  // Calculate progress percentage
  const progressPercentage = gameStarted ? (matchedPairs / getPairsForLevel(level)) * 100 : 0

  // Load mood entries from localStorage on component mount
  useEffect(() => {
    const savedEntries = localStorage.getItem("moodEntries")
    if (savedEntries) {
      // Convert string dates back to Date objects
      const parsedEntries = JSON.parse(savedEntries).map((entry: MoodEntry) => ({
        ...entry,
        date: new Date(entry.date),
      }))
      setMoodEntries(parsedEntries)
    }
  }, [])

  // Save mood entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("moodEntries", JSON.stringify(moodEntries))
  }, [moodEntries])

  // Get days of current month
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  })

  // Handle month navigation
  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)

      // Check if there's an existing entry for this date
      const existingEntry = moodEntries.find((entry) => isSameDay(entry.date, date))

      if (existingEntry) {
        setCurrentMood(existingEntry.mood)
        setCurrentNote(existingEntry.note)
        setCurrentTags(existingEntry.tags)
      } else {
        setCurrentMood("")
        setCurrentNote("")
        setCurrentTags([])
      }

      setIsDialogOpen(true)
    }
  }

  // Handle mood selection
  const handleMoodSelect = (mood: string) => {
    setCurrentMood(mood)
  }

  // Handle tag toggle
  const handleTagToggle = (tag: string) => {
    if (currentTags.includes(tag)) {
      setCurrentTags(currentTags.filter((t) => t !== tag))
    } else {
      setCurrentTags([...currentTags, tag])
    }
  }

  // Save mood entry
  const handleSaveMood = () => {
    if (!selectedDate || !currentMood) return

    // Check if there's an existing entry for this date
    const existingEntryIndex = moodEntries.findIndex((entry) => isSameDay(entry.date, selectedDate))

    if (existingEntryIndex >= 0) {
      // Update existing entry
      const updatedEntries = [...moodEntries]
      updatedEntries[existingEntryIndex] = {
        date: selectedDate,
        mood: currentMood,
        note: currentNote,
        tags: currentTags,
      }
      setMoodEntries(updatedEntries)
    } else {
      // Add new entry
      setMoodEntries([
        ...moodEntries,
        {
          date: selectedDate,
          mood: currentMood,
          note: currentNote,
          tags: currentTags,
        },
      ])
    }

    setIsDialogOpen(false)
  }

  // Delete mood entry
  const handleDeleteMood = () => {
    if (!selectedDate) return

    setMoodEntries(moodEntries.filter((entry) => !isSameDay(entry.date, selectedDate)))

    setIsDialogOpen(false)
  }

  // Get mood color for a specific date
  const getMoodColor = (date: Date) => {
    const entry = moodEntries.find((entry) => isSameDay(entry.date, date))

    if (entry) {
      const mood = moods.find((m) => m.value === entry.mood)
      return mood?.color
    }

    return undefined
  }

  // Get mood emoji for a specific date
  const getMoodEmoji = (date: Date) => {
    const entry = moodEntries.find((entry) => isSameDay(entry.date, date))

    if (entry) {
      const mood = moods.find((m) => m.value === entry.mood)
      return mood?.emoji
    }

    return undefined
  }

  // Prepare data for charts
  const prepareChartData = () => {
    // Sort entries by date
    const sortedEntries = [...moodEntries].sort((a, b) => a.date.getTime() - b.date.getTime())

    // Map entries to chart data format
    return sortedEntries.map((entry) => {
      const mood = moods.find((m) => m.value === entry.mood)
      return {
        date: format(entry.date, "MMM dd"),
        score: mood?.score || 0,
        mood: mood?.label,
      }
    })
  }

  // Prepare data for pie chart
  const preparePieData = () => {
    const moodCounts: Record<string, number> = {}

    moodEntries.forEach((entry) => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1
    })

    return moods
      .map((mood) => ({
        name: mood.label,
        value: moodCounts[mood.value] || 0,
        color: mood.color,
      }))
      .filter((item) => item.value > 0)
  }

  // Prepare tag statistics
  const prepareTagStats = () => {
    const tagCounts: Record<string, number> = {}

    moodEntries.forEach((entry) => {
      entry.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
  }

  // Export data as JSON
  const handleExportData = () => {
    const dataStr = JSON.stringify(moodEntries, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `mood-tracker-export-${format(new Date(), "yyyy-MM-dd")}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()
  }

  const chartData = prepareChartData()
  const pieData = preparePieData()
  const tagStats = prepareTagStats()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-indigo-50 to-blue-50 p-4">
      <div className="w-full max-w-4xl">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-indigo-700 mb-2 flex items-center justify-center">
            <Sparkles className="mr-2 h-8 w-8 text-yellow-500" />
            Memory Match & Mood Tracker
          </h1>
          <p className="text-gray-600 mb-4">Match pairs of cards to win. Track your daily moods and emotions.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="memory-game" className="flex items-center">
              Memory Game
            </TabsTrigger>
            <TabsTrigger value="mood-tracker" className="flex items-center">
              Mood Tracker
            </TabsTrigger>
          </TabsList>

          <TabsContent value="memory-game" className="pt-4">
            {/* Game stats */}
            <div className="flex flex-wrap justify-center gap-4 mb-4">
              <Button variant="outline" className="px-3 py-1 text-lg flex items-center justify-center">
                <Trophy className="mr-1 h-4 w-4" />
                Level: {level}
              </Button>
              <Button variant="outline" className="px-3 py-1 text-lg flex items-center justify-center">
                Moves: {moves}
              </Button>
              <Button variant="outline" className="px-3 py-1 text-lg flex items-center justify-center">
                <Timer className="mr-1 h-4 w-4" />
                Time: {formatTime(timer)}
              </Button>
              {bestScore !== null && (
                <Button variant="outline" className="px-3 py-1 text-lg flex items-center justify-center">
                  Best Score: {bestScore}
                </Button>
              )}
            </div>

            {/* Progress bar */}
            <div className="mb-4">
              <div data-value={progressPercentage} className="h-2 bg-indigo-200 rounded-full">
                <div className="h-2 bg-indigo-600 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>

            {/* Game controls */}
            <div className="flex justify-center gap-2 mb-6">
              {!gameStarted ? (
                <Button onClick={handleStartGame} className="bg-indigo-600 hover:bg-indigo-700">
                  Start Game
                </Button>
              ) : (
                <>
                  <Button onClick={handleRestart} variant="outline" className="flex items-center">
                    Restart
                  </Button>
                  {gameWon && (
                    <Button onClick={handleLevelUp} className="bg-indigo-600 hover:bg-indigo-700">
                      Next Level
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Game board */}
            {gameStarted && (
              <div className="grid grid-cols-4 gap-4 md:gap-6">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className={`relative h-24 md:h-32 cursor-pointer transition-transform duration-300 transform ${
                      card.flipped ? "scale-105" : ""
                    }`}
                    onClick={() => handleCardClick(card.id)}
                  >
                    <div
                      className={`absolute w-full h-full rounded-lg transition-all duration-500 transform ${
                        card.flipped ? "rotateY-180" : ""
                      } preserve-3d`}
                      style={{
                        transformStyle: "preserve-3d",
                        transform: card.flipped ? "rotateY(180deg)" : "",
                      }}
                    >
                      {/* Card back */}
                      <div
                        className={`absolute w-full h-full flex items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl font-bold shadow-md backface-hidden ${
                          card.matched ? "opacity-0" : "opacity-100"
                        }`}
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        ?
                      </div>

                      {/* Card front */}
                      <div
                        className={`absolute w-full h-full flex items-center justify-center rounded-lg bg-white text-4xl shadow-md backface-hidden rotateY-180 ${
                          card.matched ? "bg-green-100" : ""
                        }`}
                        style={{
                          backfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                        }}
                      >
                        {card.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Win message */}
            {gameWon && (
              <div className="mt-8 p-6 bg-white rounded-lg shadow-lg text-center">
                <h2 className="text-2xl font-bold text-indigo-700 mb-2">🎉 Level {level} Complete! 🎉</h2>
                <p className="text-gray-600 mb-4">
                  You completed the level in {moves} moves and {formatTime(timer)}!
                </p>
                <p className="text-xl font-semibold mb-4">Score: {calculateScore()}</p>
                <Button onClick={handleLevelUp} className="bg-indigo-600 hover:bg-indigo-700">
                  Next Level
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="mood-tracker" className="pt-4">
            <Card className="mb-8">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle>Your Mood Journal</CardTitle>
                  <Button variant="outline" size="icon" onClick={handleExportData}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>Record how you feel each day and track your emotional patterns</CardDescription>
              </CardHeader>

              <Tabs value={moodTab} onValueChange={setMoodTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="calendar" className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Calendar View
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="flex items-center">
                    <BarChart className="mr-2 h-4 w-4" />
                    Statistics
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="calendar" className="pt-4">
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <h2 className="text-xl font-medium">{format(currentMonth, "MMMM yyyy")}</h2>
                      <Button variant="outline" size="sm" onClick={handleNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div key={day} className="text-center text-sm font-medium text-gray-500">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {daysInMonth.map((day) => {
                        const moodColor = getMoodColor(day)
                        const moodEmoji = getMoodEmoji(day)

                        return (
                          <Button
                            key={day.toString()}
                            variant="outline"
                            className={`h-16 p-1 flex flex-col items-center justify-between border ${
                              moodColor ? `border-2` : ""
                            }`}
                            style={{
                              backgroundColor: moodColor ? `${moodColor}20` : undefined,
                              borderColor: moodColor,
                            }}
                            onClick={() => handleDateSelect(day)}
                          >
                            <span className="text-xs">{format(day, "d")}</span>
                            {moodEmoji && <span className="text-xl">{moodEmoji}</span>}
                          </Button>
                        )
                      })}
                    </div>

                    <div className="mt-6 flex flex-wrap justify-center gap-4">
                      {moods.map((mood) => (
                        <div key={mood.value} className="flex items-center">
                          <div className="w-4 h-4 rounded-full mr-1" style={{ backgroundColor: mood.color }}></div>
                          <span className="text-sm">
                            {mood.emoji} {mood.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter className="flex justify-center">
                    <Button onClick={() => handleDateSelect(new Date())} className="bg-purple-600 hover:bg-purple-700">
                      Add Today&apos;s Mood
                    </Button>
                  </CardFooter>
                </TabsContent>

                <TabsContent value="stats" className="pt-4">
                  <CardContent>
                    <div className="space-y-8">
                      {/* Mood trend chart */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">Mood Trends</h3>
                        {chartData.length > 0 ? (
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                                <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 12 }} />
                                <Tooltip
                                  formatter={(value) => [`Score: ${value}`, "Mood"]}
                                  labelFormatter={(label) => `Date: ${label}`}
                                />
                                <Line
                                  type="monotone"
                                  dataKey="score"
                                  stroke="#8884d8"
                                  strokeWidth={2}
                                  activeDot={{ r: 8 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            No mood data available yet. Start tracking your moods!
                          </div>
                        )}
                      </div>

                      {/* Mood distribution pie chart */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-medium mb-4">Mood Distribution</h3>
                          {pieData.length > 0 ? (
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                  >
                                    {pieData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">No mood data available yet.</div>
                          )}
                        </div>

                        {/* Tag statistics */}
                        <div>
                          <h3 className="text-lg font-medium mb-4">Top Tags</h3>
                          {tagStats.length > 0 ? (
                            <div className="space-y-2">
                              {tagStats.slice(0, 5).map(({ tag, count }) => (
                                <div key={tag} className="flex items-center justify-between">
                                  <span>{tag}</span>
                                  <div className="flex items-center">
                                    <div
                                      className="h-2 bg-purple-500 rounded-full mr-2"
                                      style={{
                                        width: `${Math.min(count * 20, 100)}px`,
                                      }}
                                    ></div>
                                    <span className="text-sm text-gray-500">{count}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">No tags used yet.</div>
                          )}
                        </div>
                      </div>

                      {/* Summary stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-purple-50">
                          <CardContent className="p-4 text-center">
                            <p className="text-sm text-gray-500">Total Entries</p>
                            <p className="text-2xl font-bold">{moodEntries.length}</p>
                          </CardContent>
                        </Card>

                        <Card className="bg-blue-50">
                          <CardContent className="p-4 text-center">
                            <p className="text-sm text-gray-500">Average Mood</p>
                            <p className="text-2xl font-bold">
                              {chartData.length > 0
                                ? (chartData.reduce((sum, item) => sum + item.score, 0) / chartData.length).toFixed(1)
                                : "N/A"}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-green-50">
                          <CardContent className="p-4 text-center">
                            <p className="text-sm text-gray-500">Best Day</p>
                            <p className="text-2xl font-bold">
                              {chartData.length > 0
                                ? chartData.reduce(
                                    (best, item) => (item.score > best.score ? item : best),
                                    chartData[0],
                                  ).date
                                : "N/A"}
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-yellow-50">
                          <CardContent className="p-4 text-center">
                            <p className="text-sm text-gray-500">Streak</p>
                            <p className="text-2xl font-bold">
                              {/* Calculate streak logic would go here */}
                              {moodEntries.length > 0 ? "3 days" : "0 days"}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </TabsContent>
              </Tabs>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Mood entry dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedDate && `Record Mood for ${format(selectedDate, "MMMM d, yyyy")}`}</DialogTitle>
              <DialogDescription>How are you feeling today? Select a mood and add notes.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-5 gap-2">
                {moods.map((mood) => (
                  <Button
                    key={mood.value}
                    type="button"
                    variant={currentMood === mood.value ? "default" : "outline"}
                    className="h-20 flex flex-col items-center justify-center gap-1"
                    style={{
                      backgroundColor: currentMood === mood.value ? mood.color : undefined,
                      borderColor: mood.color,
                      color: currentMood === mood.value ? "white" : undefined,
                    }}
                    onClick={() => handleMoodSelect(mood.value)}
                  >
                    <span className="text-2xl">{mood.emoji}</span>
                    <span className="text-xs">{mood.label}</span>
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Notes</Label>
                <Textarea
                  id="note"
                  placeholder="What made you feel this way today?"
                  value={currentNote}
                  onChange={(e) => setCurrentNote(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {moodTags.map((tag) => (
                    <Button
                      key={tag}
                      type="button"
                      variant={currentTags.includes(tag) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleTagToggle(tag)}
                      className={currentTags.includes(tag) ? "bg-purple-600" : ""}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-between sm:justify-between">
              <Button type="button" variant="destructive" onClick={handleDeleteMood}>
                Delete
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveMood}
                  disabled={!currentMood}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Save
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

