import { Board, SharedBoard } from './types';

export const initialBoards: Board[] = [
  {
    id: 'calculus-2',
    title: 'Calculus II: Integration Methods',
    modifiedAt: 'Modified 2h ago',
    period: 'Period 4',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAH6Dq9XpH5k8c7WhdGz39HLOGNhZE47pAUUUsqjp6WFFV1-qQDCX9or1IvEGBoY5rDRBHrDnCwlCQEShp5IPQdxKdfUJdfSQ8zgYqPPDpfQMXL7t4drBCCphXes-g7-4iPGN71HoF-b1WA42qj6bxg83txiM3VFbq7m7Nr5kLAPPVkXObHFkms6CbBBycIFA5pIg6hbx8maUIvgqDaimETUuNi8eS9NdesO3yW5CnySoophEoiY-Fd',
    elements: [
      {
        id: 'calc-f1',
        type: 'text',
        x: 120,
        y: 120,
        width: 320,
        height: 60,
        content: '\\int \\frac{2x^2+5x-3}{x(x-1)(x+1)} dx = A \\ln|x| + B \\ln|x-1| + C \\ln|x+1| + C',
        isFormula: true,
        strokeColor: '#003fb1'
      },
      {
        id: 'calc-f2',
        type: 'text',
        x: 180,
        y: 240,
        width: 250,
        height: 50,
        content: '\\int \\sec^2(x) dx = \\tan(x) + C',
        isFormula: true,
        strokeColor: '#006a61'
      },
      {
        id: 'calc-f3',
        type: 'text',
        x: 480,
        y: 150,
        width: 200,
        height: 50,
        content: 'f(x) = x^2 \\cdot e^{-x}',
        isFormula: true,
        strokeColor: '#ba1a1a'
      },
      {
        id: 'calc-s1',
        type: 'sticky',
        x: 520,
        y: 280,
        width: 180,
        height: 140,
        content: 'Review integration by parts formula:\n\n∫ u dv = u·v - ∫ v du',
        color: 'yellow'
      },
      {
        id: 'calc-g1',
        type: 'shape',
        shapeType: 'line',
        x: 150,
        y: 450,
        width: 450,
        height: 450,
        strokeColor: '#737686',
        strokeWidth: 2,
        label: 'x-axis'
      },
      {
        id: 'calc-g2',
        type: 'shape',
        shapeType: 'arrow',
        x: 300,
        y: 500,
        width: 300,
        height: 350,
        strokeColor: '#737686',
        strokeWidth: 2,
        label: 'y-axis'
      }
    ]
  },
  {
    id: 'physics-orbital',
    title: 'Physics: Orbital Mechanics',
    modifiedAt: 'Modified Yesterday',
    period: 'AP Physics',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAWJB1wPlUjpakaZ1O5Yw-COcB8GtUQ2EqteENAAErWz67T9XCPGmLrsNbyCXtY-7GmErRiDP5_XxFe5UEfcIxrsPadc_kJulMoO2MPnquiM4-6oWzHsWFOO--5ERT3Gz2C-KZuO5fZhp_89pGlcMyK9zBU5-ZZDnhGojF5DbI_C8_8kgEQlCBKbLq93qaw7sPUsW5Wb8GwvOhdhOgmdGhfSs4S2kKtWrDhdTnNoPk9S1gtcUX0ekLP',
    elements: [
      {
        id: 'phys-f1',
        type: 'text',
        x: 150,
        y: 120,
        width: 250,
        height: 60,
        content: 'F_g = G \\cdot \\frac{M \\cdot m}{r^2}',
        isFormula: true,
        strokeColor: '#003fb1'
      },
      {
        id: 'phys-f2',
        type: 'text',
        x: 480,
        y: 120,
        width: 250,
        height: 60,
        content: 'v_{orbit} = \\sqrt{\\frac{G \\cdot M}{r}}',
        isFormula: true,
        strokeColor: '#006a61'
      },
      {
        id: 'phys-earth',
        type: 'shape',
        shapeType: 'circle',
        x: 400,
        y: 320,
        width: 80,
        height: 80,
        strokeColor: '#003fb1',
        strokeWidth: 3,
        label: 'EARTH (Mass M)'
      },
      {
        id: 'phys-sat',
        type: 'shape',
        shapeType: 'circle',
        x: 600,
        y: 320,
        width: 20,
        height: 20,
        strokeColor: '#006a61',
        strokeWidth: 2,
        label: 'Satellite (m)'
      },
      {
        id: 'phys-vec-fg',
        type: 'shape',
        shapeType: 'arrow',
        x: 600,
        y: 320,
        width: 480,
        height: 320,
        strokeColor: '#ba1a1a',
        strokeWidth: 2,
        label: 'Force of Gravity (Fg)'
      },
      {
        id: 'phys-vec-v',
        type: 'shape',
        shapeType: 'arrow',
        x: 600,
        y: 320,
        width: 600,
        height: 200,
        strokeColor: '#006a61',
        strokeWidth: 2,
        label: 'Velocity (v)'
      },
      {
        id: 'phys-s1',
        type: 'sticky',
        x: 150,
        y: 380,
        width: 180,
        height: 150,
        content: 'Centripetal Force:\nFc = m·v² / r\n\nSets Fc = Fg to derive orbital speed!',
        color: 'cyan'
      }
    ]
  },
  {
    id: 'organic-chem',
    title: 'Organic Chem: Lab Prep',
    modifiedAt: 'Modified 3 days ago',
    period: 'Grade 11',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPC7P6G2EhV3gMscg0DNV-xa33mURTe02bHckIU1s3XWeTOPzM1nDFMtEsW7-rTaG-rhnnLeVwbhMb9Vqn_XZUFx7krVcaXFWf4ZKF2CenkdP_AiUFgM7olTvgCtpGC8oOiY39ebD7pIuXlQRIdiLOrdZrbhr7Nk5n8u6PT3yo4lKOSfh38qZUujtwizf5PVdu1RSO1Tn4GSwefXsHV5zo77ROJVISwwldPYuCBKaMNJIe6wTI-onO',
    elements: [
      {
        id: 'chem-f1',
        type: 'text',
        x: 150,
        y: 130,
        width: 200,
        height: 50,
        content: 'C_6H_6 \\quad \\text{(Benzene)}',
        isFormula: true,
        strokeColor: '#474a4c'
      },
      {
        id: 'chem-f2',
        type: 'text',
        x: 480,
        y: 130,
        width: 200,
        height: 50,
        content: 'D\\text{-Glucose Structure}',
        isFormula: true,
        strokeColor: '#003fb1'
      },
      {
        id: 'chem-ring',
        type: 'shape',
        shapeType: 'hexagon',
        x: 250,
        y: 280,
        width: 100,
        height: 100,
        strokeColor: '#474a4c',
        strokeWidth: 3,
        label: 'Aromatic Ring'
      },
      {
        id: 'chem-s1',
        type: 'sticky',
        x: 520,
        y: 250,
        width: 180,
        height: 140,
        content: 'Reagents:\nNitration mixture\nHNO3 / H2SO4\n\nYield target: > 78%',
        color: 'pink'
      },
      {
        id: 'chem-s2',
        type: 'sticky',
        x: 100,
        y: 350,
        width: 180,
        height: 140,
        content: 'Safety notes:\n- Use fume hood\n- Gloves + Goggles\n- Corrosive acids!',
        color: 'green'
      }
    ]
  }
];

export const initialSharedBoards: SharedBoard[] = [
  {
    id: 'shared-thermo',
    title: 'Thermodynamics Review',
    owner: 'Dr. John Doe',
    ownerInitials: 'JD',
    ownerColor: 'bg-primary-container text-on-primary-container',
    lastAccessed: 'Oct 24, 2023',
    icon: 'description'
  },
  {
    id: 'shared-datascience',
    title: 'Data Science 101: Project Alpha',
    owner: 'Sarah Miller',
    ownerInitials: 'SM',
    ownerColor: 'bg-secondary-container text-on-secondary-container',
    lastAccessed: 'Oct 22, 2023',
    icon: 'analytics'
  }
];
