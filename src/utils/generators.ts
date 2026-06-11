export type GameConfig = {
  type: 'multiple_choice'; 
  question: string;
  options: string[];
  correctIndex: number;
};

// Generador determinístico procedural.
// Esto permite crear preguntas infinitas con lógica matemática perfecta,
// sin riesgo de alucinaciones de la IA.
export function generateMathExercise(topic: string): GameConfig {
  if (topic === 'fracciones') {
    const num1 = Math.floor(Math.random() * 5) + 1;
    const num2 = Math.floor(Math.random() * 5) + 1;
    const den = Math.floor(Math.random() * 5) + 3; // Denominador común (3 a 7)
    
    const answerNum = num1 + num2;
    
    // Generar opciones asegurando que una sea correcta y no haya repetidas
    const correct = `${answerNum}/${den}`;
    const optionsSet = new Set<string>();
    optionsSet.add(correct);
    
    while(optionsSet.size < 3) {
      const fakeAnswer = answerNum + (Math.floor(Math.random() * 6) - 3); // -3 a +2 de error
      if (fakeAnswer !== answerNum && fakeAnswer > 0) {
        optionsSet.add(`${fakeAnswer}/${den}`);
      }
    }
    
    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);
    const correctIndex = options.indexOf(correct);

    return {
      type: 'multiple_choice',
      question: `Suma estas fracciones:\n\n**${num1}/${den}** + **${num2}/${den}** = ?`,
      options,
      correctIndex
    };
  }

  // Fallback multiplicacion
  const a = Math.floor(Math.random() * 10) + 2;
  const b = Math.floor(Math.random() * 10) + 2;
  const answer = a * b;
  
  const optionsSet = new Set<number>();
  optionsSet.add(answer);
  while(optionsSet.size < 3) {
    const fake = answer + (Math.floor(Math.random() * 10) - 5);
    if (fake !== answer && fake > 0) optionsSet.add(fake);
  }
  
  const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);
  const correctIndex = options.indexOf(answer);

  return {
    type: 'multiple_choice',
    question: `Calcula rápidamente:\n\n**${a} x ${b}** = ?`,
    options: options.map(String),
    correctIndex
  };
}
