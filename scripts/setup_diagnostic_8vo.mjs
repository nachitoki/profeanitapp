import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyFakeKeyForLocalDev_replaceIfNeeded",
  authDomain: "profeanitapp.firebaseapp.com",
  projectId: "profeanitapp",
  storageBucket: "profeanitapp.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const diagnosticModule = {
  id: "diagnostic_8vo_01",
  type: "diagnostic",
  title: "Diagnóstico Inicial 8vo Básico",
  theme: "Exploración General",
  xpReward: 300,
  explanation: [
    {
      type: "text",
      content: "¡Bienvenido a tu Evaluación Diagnóstica! Esta misión especial nos ayudará a calibrar tu Radar de Habilidades."
    },
    {
      type: "highlight",
      title: "Instrucciones",
      content: "Responde lo mejor que puedas. Si te equivocas, la pregunta volverá a aparecer al final para que puedas intentarlo de nuevo hasta lograrlo. ¡Tú puedes!"
    }
  ],
  games: [
    // --- NÚMEROS Y OPERACIONES ---
    {
      type: "multiple_choice",
      skillTag: "Números y Operaciones",
      question: "Si la temperatura en la Antártida es de -15°C y desciende 8°C más, ¿cuál es la nueva temperatura?",
      options: ["-7°C", "23°C", "-23°C"],
      correctIndex: 2
    },
    {
      type: "multiple_choice",
      skillTag: "Números y Operaciones",
      question: "Resuelve la siguiente operación combinada: (-4) × (-5) - 10",
      options: ["10", "-30", "-10"],
      correctIndex: 0
    },
    {
      type: "multiple_choice",
      skillTag: "Números y Operaciones",
      question: "¿Cuál es el resultado de calcular 2³ + 3²?",
      options: ["12", "17", "25"],
      correctIndex: 1
    },
    {
      type: "multiple_choice",
      skillTag: "Números y Operaciones",
      question: "¿Entre qué par de números enteros se encuentra la raíz cuadrada de 30 (√30)?",
      options: ["Entre 3 y 4", "Entre 4 y 5", "Entre 5 y 6"],
      correctIndex: 2
    },
    // --- PATRONES Y ÁLGEBRA ---
    {
      type: "multiple_choice",
      skillTag: "Patrones y Álgebra",
      question: "Resuelve la ecuación: 3x - 5 = 10",
      options: ["x = 5", "x = 15", "x = 3"],
      correctIndex: 0
    },
    {
      type: "multiple_choice",
      skillTag: "Patrones y Álgebra",
      question: "Si la función es f(x) = 2x + 1, ¿cuál es el valor de f(4)?",
      options: ["7", "9", "8"],
      correctIndex: 1
    },
    {
      type: "multiple_choice",
      skillTag: "Patrones y Álgebra",
      question: "El doble de un número aumentado en 4 es igual a 20. ¿Qué ecuación representa este enunciado?",
      options: ["2x + 4 = 20", "x/2 + 4 = 20", "2(x + 4) = 20"],
      correctIndex: 0
    },
    {
      type: "multiple_choice",
      skillTag: "Patrones y Álgebra",
      question: "En una función lineal f(x) = mx, si m es negativo, ¿cómo es la gráfica de la función?",
      options: ["Creciente", "Decreciente", "Horizontal"],
      correctIndex: 1
    },
    // --- GEOMETRÍA ---
    {
      type: "multiple_choice",
      skillTag: "Geometría",
      question: "Según el Teorema de Pitágoras, en un triángulo rectángulo, el cuadrado de la hipotenusa es igual a...",
      options: ["La diferencia de los catetos", "El producto de los catetos", "La suma de los cuadrados de los catetos"],
      correctIndex: 2
    },
    {
      type: "multiple_choice",
      skillTag: "Geometría",
      question: "Si los catetos de un triángulo rectángulo miden 3 cm y 4 cm, ¿cuánto mide la hipotenusa?",
      options: ["5 cm", "7 cm", "25 cm"],
      correctIndex: 0
    },
    {
      type: "multiple_choice",
      skillTag: "Geometría",
      question: "¿Cuál es la fórmula para calcular el volumen de un cilindro?",
      options: ["π × r × h", "π × r² × h", "2 × π × r × h"],
      correctIndex: 1
    },
    {
      type: "multiple_choice",
      skillTag: "Geometría",
      question: "Si trasladas un triángulo 5 unidades a la derecha en el plano cartesiano, ¿qué ocurre con su forma y tamaño?",
      options: ["Cambian de forma", "Se hacen más grandes", "Se mantienen exactamente iguales (Isometría)"],
      correctIndex: 2
    },
    // --- DATOS Y PROBABILIDADES ---
    {
      type: "multiple_choice",
      skillTag: "Datos y Probabilidades",
      question: "Si lanzas un dado normal de 6 caras, ¿cuál es la probabilidad de que salga un número mayor que 4?",
      options: ["1/6", "2/6 (o 1/3)", "3/6 (o 1/2)"],
      correctIndex: 1
    },
    {
      type: "multiple_choice",
      skillTag: "Datos y Probabilidades",
      question: "Tus notas en la clase de historia son: 5.0, 6.0, 4.0 y 7.0. ¿Cuál es tu promedio (media)?",
      options: ["5.0", "5.5", "6.0"],
      correctIndex: 1
    },
    {
      type: "multiple_choice",
      skillTag: "Datos y Probabilidades",
      question: "¿Cuál de estos conceptos divide un conjunto de datos ordenados exactamente por la mitad?",
      options: ["La Mediana", "La Moda", "La Media"],
      correctIndex: 0
    }
  ]
};

async function installDiagnostic() {
  console.log('Instalando Módulo Diagnóstico...');

  // 1. Instalar en la colección 'modules' maestra
  await setDoc(doc(db, 'modules', diagnosticModule.id), diagnosticModule, { merge: true });
  console.log(`Módulo guardado en 'modules/${diagnosticModule.id}'`);

  // 2. Asignarlo a todos los estudiantes (banco maestro + inventario local por compatibilidad)
  const studentsSnapshot = await getDocs(collection(db, 'students'));
  for (const studentDoc of studentsSnapshot.docs) {
    const studentId = studentDoc.id;
    const studentData = studentDoc.data();
    let assignedModules = studentData.assignedModules || [];

    // Guardar en la subcolección por si acaso (compatibilidad hacia atrás)
    const studentModRef = doc(db, `students/${studentId}/modules`, diagnosticModule.id);
    await setDoc(studentModRef, diagnosticModule, { merge: true });

    // Actualizar el array principal de assignedModules
    if (!assignedModules.includes(diagnosticModule.id)) {
      assignedModules.push(diagnosticModule.id);
    }

    await setDoc(doc(db, 'students', studentId), { assignedModules }, { merge: true });
    console.log(`Diagnóstico asignado al estudiante ${studentId}.`);
  }

  console.log('¡Diagnóstico instalado exitosamente!');
}

installDiagnostic().catch(console.error);
