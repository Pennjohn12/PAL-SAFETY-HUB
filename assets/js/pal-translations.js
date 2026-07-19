export const PAL_TRANSLATIONS = {
  orientation: {
    en: {
      moduleTitle: 'PAL Employee Safety Orientation',
      moduleCopy: 'Watch each chapter and answer its safety question correctly to continue.',
      completeLabel: 'Video complete',
      chapterLabel: chapter => `Chapter ${chapter} of 5`,
      checkLabel: count => `${count} of 5 checks complete`,
      questionTitle: index => `Knowledge Check ${index + 1} of 5`,
      ack: 'I watched the complete PAL orientation, answered all five knowledge checks, and understand that I must stop and ask for help whenever I am not trained, authorized, equipped, or certain the work can be performed safely.',
      reviewTitle: 'Employee Review',
      reviewCopy: 'Please read and acknowledge the basic PAL orientation items below before signing.',
      reviewItems: [
        'I understand that I must follow PAL Environmental Services safety policies and site-specific rules at all times.',
        'I understand that required PPE must be worn as directed, including hard hat, safety glasses, work boots, gloves, and high-visibility clothing/vest when required.',
        'I understand that I must attend required safety meetings, toolbox talks, and site orientation before performing work.',
        'I understand that I must report hazards, incidents, near misses, injuries, damaged equipment, and unsafe conditions immediately to my foreman/supervisor.',
        'I understand that I may not operate equipment, work from lifts, perform scaffold work, or perform specialized work unless properly trained/authorized.',
        'I understand that certifications and required documents must be clear, readable, current, and provided to PAL before I am cleared to work.'
      ],
      questions: [
        {
          question: 'When may an employee use a respirator for PAL work?',
          answers: ['Whenever dust is visible', 'After the required medical clearance, fit test, training, and authorization', 'Whenever a coworker has an extra respirator', 'Only after the shift has started'],
          correct: 1,
          correction: 'Respirators require medical clearance, fit testing, training, and authorization. Stop and speak with supervision if respiratory protection may be needed.'
        },
        {
          question: "Under PAL's Ladders Last Policy, what is the required equipment-selection order?",
          answers: ['Traditional ladder, podium ladder, scaffold, aerial lift', 'Aerial lift, scaffolding, podium or platform ladder, traditional portable ladder last when permitted', 'Podium ladder, traditional ladder, aerial lift, scaffolding', 'The employee may choose any option without supervisor review'],
          correct: 1,
          correction: 'PAL requires safer work platforms to be evaluated first. Traditional portable ladders are the last resort and may be used only when permitted.'
        },
        {
          question: 'What must you do if you find an unlabeled chemical container?',
          answers: ['Smell it to identify the contents', 'Use it carefully and label it later', 'Do not use it; isolate it and notify supervision', 'Pour it into a different container'],
          correct: 2,
          correction: 'Never use an unknown or unlabeled material. Stop, isolate the container if safe, and notify supervision.'
        },
        {
          question: 'What should you do before entering a confined space?',
          answers: ['Enter briefly to check whether it seems safe', 'Enter only when specifically trained, authorized, and working under the required procedure', 'Ask a coworker to wait outside', 'Wear a dust mask and proceed'],
          correct: 1,
          correction: 'This orientation does not authorize confined-space entry. Specialized training, authorization, equipment, and an approved procedure are required.'
        },
        {
          question: 'When must an accident, injury, environmental release, or near miss be reported?',
          answers: ['At the end of the week', 'Only when medical treatment is required', 'Immediately, even when it appears minor', 'Only when property was damaged'],
          correct: 2,
          correction: 'Report every incident and near miss immediately to your supervisor and PAL EH&S, even when it appears minor.'
        }
      ]
    },
    es: {
      moduleTitle: 'Orientación de Seguridad para Empleados de PAL',
      moduleCopy: 'Mire cada capítulo y conteste correctamente la pregunta de seguridad para continuar.',
      completeLabel: 'Video completo',
      chapterLabel: chapter => `Capítulo ${chapter} de 5`,
      checkLabel: count => `${count} de 5 preguntas completas`,
      questionTitle: index => `Pregunta de Seguridad ${index + 1} de 5`,
      ack: 'Vi la orientación completa de PAL, contesté correctamente las cinco preguntas de seguridad y entiendo que debo detenerme y pedir ayuda cuando no esté capacitado, autorizado, equipado o seguro de que el trabajo se puede realizar de manera segura.',
      reviewTitle: 'Revisión del Empleado',
      reviewCopy: 'Lea y confirme los puntos básicos de orientación de PAL antes de firmar.',
      reviewItems: [
        'Entiendo que debo seguir en todo momento las políticas de seguridad de PAL Environmental Services y las reglas específicas del sitio.',
        'Entiendo que debo usar el PPE requerido según se indique, incluyendo casco, gafas de seguridad, botas de trabajo, guantes y chaleco o ropa de alta visibilidad cuando sea requerido.',
        'Entiendo que debo asistir a las reuniones de seguridad, charlas de seguridad y orientación del sitio requeridas antes de realizar trabajo.',
        'Entiendo que debo reportar inmediatamente a mi capataz/supervisor los peligros, incidentes, casi accidentes, lesiones, equipo dañado y condiciones inseguras.',
        'Entiendo que no puedo operar equipos, trabajar desde elevadores, realizar trabajo en andamios o realizar trabajo especializado a menos que esté debidamente capacitado y autorizado.',
        'Entiendo que las certificaciones y documentos requeridos deben estar claros, legibles, vigentes y entregados a PAL antes de que se me autorice a trabajar.'
      ],
      questions: [
        {
          question: '¿Cuándo puede un empleado usar un respirador para trabajo de PAL?',
          answers: ['Cuando se vea polvo', 'Después de la aprobación médica, prueba de ajuste, capacitación y autorización requeridas', 'Cuando un compañero tenga un respirador extra', 'Solo después de comenzar el turno'],
          correct: 1,
          correction: 'Los respiradores requieren aprobación médica, prueba de ajuste, capacitación y autorización. Deténgase y hable con supervisión si puede necesitar protección respiratoria.'
        },
        {
          question: 'Según la política Ladders Last de PAL, ¿cuál es el orden requerido para escoger el equipo?',
          answers: ['Escalera tradicional, escalera de plataforma, andamio, elevador aéreo', 'Elevador aéreo, andamio, escalera de plataforma o podio, escalera portátil tradicional como último recurso cuando esté permitido', 'Escalera de podio, escalera tradicional, elevador aéreo, andamio', 'El empleado puede escoger cualquier opción sin revisión del supervisor'],
          correct: 1,
          correction: 'PAL requiere evaluar primero plataformas de trabajo más seguras. Las escaleras portátiles tradicionales son el último recurso y solo pueden usarse cuando estén permitidas.'
        },
        {
          question: '¿Qué debe hacer si encuentra un envase químico sin etiqueta?',
          answers: ['Olerlo para identificarlo', 'Usarlo con cuidado y etiquetarlo después', 'No usarlo; aislarlo y avisar a supervisión', 'Verterlo en otro envase'],
          correct: 2,
          correction: 'Nunca use un material desconocido o sin etiqueta. Deténgase, aísle el envase si es seguro hacerlo y avise a supervisión.'
        },
        {
          question: '¿Qué debe hacer antes de entrar a un espacio confinado?',
          answers: ['Entrar brevemente para ver si parece seguro', 'Entrar solo si está específicamente capacitado, autorizado y trabajando bajo el procedimiento requerido', 'Pedir a un compañero que espere afuera', 'Usar una mascarilla contra polvo y continuar'],
          correct: 1,
          correction: 'Esta orientación no autoriza la entrada a espacios confinados. Se requiere capacitación especializada, autorización, equipo y un procedimiento aprobado.'
        },
        {
          question: '¿Cuándo se debe reportar un accidente, lesión, derrame ambiental o casi accidente?',
          answers: ['Al final de la semana', 'Solo cuando se necesite tratamiento médico', 'Inmediatamente, aunque parezca menor', 'Solo cuando haya daño a propiedad'],
          correct: 2,
          correction: 'Reporte inmediatamente todos los incidentes y casi accidentes a su supervisor y a PAL EH&S, aunque parezcan menores.'
        }
      ]
    },
    pl: {
      moduleTitle: 'Szkolenie BHP dla Pracowników PAL',
      moduleCopy: 'Obejrzyj każdy rozdział i odpowiedz poprawnie na pytanie bezpieczeństwa, aby kontynuować.',
      completeLabel: 'Film ukończony',
      chapterLabel: chapter => `Rozdział ${chapter} z 5`,
      checkLabel: count => `${count} z 5 pytań ukończonych`,
      questionTitle: index => `Pytanie Kontrolne ${index + 1} z 5`,
      ack: 'Obejrzałem całe szkolenie PAL, poprawnie odpowiedziałem na pięć pytań kontrolnych i rozumiem, że muszę zatrzymać pracę i poprosić o pomoc, gdy nie jestem przeszkolony, upoważniony, wyposażony lub pewny, że praca może być wykonana bezpiecznie.',
      reviewTitle: 'Potwierdzenie Pracownika',
      reviewCopy: 'Przeczytaj i potwierdź podstawowe punkty szkolenia PAL przed podpisaniem.',
      reviewItems: [
        'Rozumiem, że muszę zawsze przestrzegać zasad bezpieczeństwa PAL Environmental Services oraz zasad obowiązujących na danym miejscu pracy.',
        'Rozumiem, że wymagane PPE musi być noszone zgodnie z poleceniami, w tym kask, okulary ochronne, buty robocze, rękawice oraz odzież lub kamizelka o wysokiej widoczności, gdy jest wymagana.',
        'Rozumiem, że przed rozpoczęciem pracy muszę uczestniczyć w wymaganych spotkaniach BHP, rozmowach toolbox talk i szkoleniu stanowiskowym.',
        'Rozumiem, że muszę natychmiast zgłaszać brygadziście lub przełożonemu zagrożenia, zdarzenia, sytuacje potencjalnie wypadkowe, urazy, uszkodzony sprzęt i niebezpieczne warunki.',
        'Rozumiem, że nie mogę obsługiwać sprzętu, pracować z podnośników, wykonywać pracy na rusztowaniach ani pracy specjalistycznej bez odpowiedniego przeszkolenia i upoważnienia.',
        'Rozumiem, że certyfikaty i wymagane dokumenty muszą być wyraźne, czytelne, aktualne i dostarczone do PAL, zanim zostanę dopuszczony do pracy.'
      ],
      questions: [
        {
          question: 'Kiedy pracownik może używać respiratora podczas pracy dla PAL?',
          answers: ['Zawsze, gdy widać pył', 'Po wymaganej zgodzie medycznej, teście dopasowania, szkoleniu i upoważnieniu', 'Gdy współpracownik ma dodatkowy respirator', 'Dopiero po rozpoczęciu zmiany'],
          correct: 1,
          correction: 'Respiratory wymagają zgody medycznej, testu dopasowania, szkolenia i upoważnienia. Zatrzymaj pracę i porozmawiaj z przełożonym, jeśli ochrona dróg oddechowych może być potrzebna.'
        },
        {
          question: 'Zgodnie z polityką PAL Ladders Last, jaka jest wymagana kolejność wyboru sprzętu?',
          answers: ['Zwykła drabina, drabina podium, rusztowanie, podnośnik', 'Podnośnik, rusztowanie, drabina podium lub platformowa, tradycyjna przenośna drabina jako ostatnia opcja, gdy jest dozwolona', 'Drabina podium, zwykła drabina, podnośnik, rusztowanie', 'Pracownik może wybrać dowolną opcję bez zgody przełożonego'],
          correct: 1,
          correction: 'PAL wymaga najpierw oceny bezpieczniejszych platform roboczych. Tradycyjne przenośne drabiny są ostatecznością i mogą być używane tylko wtedy, gdy jest to dozwolone.'
        },
        {
          question: 'Co należy zrobić, gdy znajdziesz nieopisany pojemnik z chemikaliami?',
          answers: ['Powąchać go, aby rozpoznać zawartość', 'Użyć ostrożnie i oznaczyć później', 'Nie używać; odizolować go i powiadomić przełożonego', 'Przelać do innego pojemnika'],
          correct: 2,
          correction: 'Nigdy nie używaj nieznanego lub nieopisanego materiału. Zatrzymaj się, odizoluj pojemnik, jeśli jest to bezpieczne, i powiadom przełożonego.'
        },
        {
          question: 'Co należy zrobić przed wejściem do przestrzeni zamkniętej?',
          answers: ['Wejść na chwilę, aby sprawdzić, czy wygląda bezpiecznie', 'Wejść tylko wtedy, gdy jesteś specjalnie przeszkolony, upoważniony i pracujesz zgodnie z wymaganą procedurą', 'Poprosić współpracownika, aby poczekał na zewnątrz', 'Założyć maskę przeciwpyłową i wejść'],
          correct: 1,
          correction: 'To szkolenie nie upoważnia do wejścia do przestrzeni zamkniętych. Wymagane są specjalistyczne szkolenie, upoważnienie, sprzęt i zatwierdzona procedura.'
        },
        {
          question: 'Kiedy należy zgłosić wypadek, uraz, wyciek środowiskowy lub sytuację potencjalnie wypadkową?',
          answers: ['Pod koniec tygodnia', 'Tylko gdy potrzebne jest leczenie', 'Natychmiast, nawet jeśli wydaje się drobne', 'Tylko gdy uszkodzono mienie'],
          correct: 2,
          correction: 'Każde zdarzenie i sytuację potencjalnie wypadkową zgłoś natychmiast przełożonemu oraz PAL EH&S, nawet jeśli wydaje się drobna.'
        }
      ]
    }
  }
};
