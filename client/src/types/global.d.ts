interface Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

declare class SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  
  constructor();
  
  start(): void;
  stop(): void;
  abort(): void;
  
  onstart: (event: Event) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: (event: Event) => void;
}

interface SpeechRecognitionEventInit extends EventInit {
  resultIndex?: number;
  results: SpeechRecognitionResultList;
}

declare class SpeechRecognitionEvent extends Event {
  constructor(type: string, eventInitDict: SpeechRecognitionEventInit);
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventInit extends EventInit {
  error: string;
  message?: string;
}

declare class SpeechRecognitionErrorEvent extends Event {
  constructor(type: string, eventInitDict: SpeechRecognitionErrorEventInit);
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}