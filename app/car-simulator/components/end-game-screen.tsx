"use client"

export default function EndGameScreen({ position, quizResults, onRestart }) {
  const correctAnswers = quizResults.filter((result) => result.isCorrect).length

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <h1 className="text-3xl font-bold mb-4 text-center">Race Complete!</h1>

        <div className="mb-6 text-center">
          <p className="text-2xl font-bold">
            You finished in position: <span className="text-blue-600">{position}</span>
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2">Quiz Results</h2>
          <p className="mb-4">
            You answered <span className="font-bold">{correctAnswers}</span> out of{" "}
            <span className="font-bold">{quizResults.length}</span> questions correctly.
          </p>

          {quizResults.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Question</th>
                    <th className="p-2 text-left">Your Answer</th>
                    <th className="p-2 text-left">Correct Answer</th>
                    <th className="p-2 text-center">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {quizResults.map((result, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">{result.question}</td>
                      <td className="p-2">{result.userAnswer}</td>
                      <td className="p-2">{result.correctAnswer}</td>
                      <td className="p-2 text-center">
                        {result.isCorrect ? (
                          <span className="text-green-600 font-bold">✓</span>
                        ) : (
                          <span className="text-red-600 font-bold">✗</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 italic">No questions were answered during the race.</p>
          )}
        </div>

        <button
          onClick={onRestart}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
        >
          Race Again
        </button>
      </div>
    </div>
  )
}

