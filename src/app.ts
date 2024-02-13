interface Draggable {
  dragStartHandler(event: DragEvent): void;
  dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
  dragOverHandler(event: DragEvent): void;
  dropHandler(event: DragEvent): void;
  dragLeaveHandler(event: DragEvent): void;
}

enum ProjectStatus { 
  Active, 
  Finished 
}

class Project {
  constructor( // 매개변수들을 각각 해당하는 속성에 할당하는데 새로운 프로젝트 객체를 생성할 수 있음
    /* 타입에 대해 패러미터나 아규먼트를 지정하기 위한 단축어 사용 */
    public id: string, 
    public title: string, 
    public description: string, 
    public people: number, 
    public status: ProjectStatus // 프로젝트의 상태를 나타내는 열거형으로 타입에서 양자택일로 선택할 때 사용하는게 좋음
  ) {}
}

/* 프로젝트 상태 관리. 제네릭 타입은 타입을 패러미터로 가지는 클래스나 인터페이스를 의미하는데 컴파일 시에 타입을 체크하고, 타입 변환을 줄여주는 기능을 함 */
type Listener<T> = (items: T[]) => void; // 프로젝트 상태가 변경될 때 실행할 콜백 함수의 타입을 정의함

class State<T> {
  protected listeners: Listener<T>[] = [];

  /* 프로젝트 상태가 변경될 때 호출되는 함수를 listeners 배열에 추가 */
  addListener(listenerFn: Listener<T>) {
    this.listeners.push(listenerFn);
  }
}

class ProjectState extends State<Project> {
  private projects: Project[] = [];
  private static instance: ProjectState;

  private constructor() {
    super();
  }

  static getInstance() { // 클래스의 인스턴스를 반환
    if(this.instance) {
      return this.instance;
    }

    this.instance = new ProjectState();

    return this.instance;
  }

  /* 새로운 프로젝트를 생성하고 projects 배열에 추가 */
  addProject(title: string, description: string, numOfPeople: number) {
    const newProject = new Project(
      Math.random().toString(), 
      title, 
      description, 
      numOfPeople,
      ProjectStatus.Active
    ); // 임의의 id, 매개변수로 받은 정보, Active 상태를 가지는 새로운 프로젝트 객체를 생성

    this.projects.push(newProject);
    this.updateListeners();
  }

  /* 프로젝트의 상태를 변경 */
  moveProject(projectId: string, newStatus: ProjectStatus) {
    const project = this.projects.find(prj => prj.id === projectId);

    if(project && project.status !== newStatus) {
      project.status = newStatus;
      this.updateListeners();
    }
  }

  /* 프로젝트 상태가 변경될 때 리스너 함수들을 실행 */
  private updateListeners() {
    for(const listenerFn of this.listeners) {
      listenerFn(this.projects.slice());
    }
  }
}

const projectState = ProjectState.getInstance(); // 프로젝트 상태를 관리하는 객체를 참조하는 상수를 선언

/* 검증 타입 정의. 아래 value를 제외한 나머지 속성들은 값이 유효하지 않은 타입이 올 수 있는 undefined를 나타내는 대신 '속성?: 타입' 꼴로 표현 */
interface Validatable {
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

/* 검증 기능을 나타내는 함수 정의. Validatable에 존재하는 속성들을 검사하는데 기본값은 true고 하나라도 없으면 false가 되게함 */
function validate(validatableInput: Validatable) {
  let isValid = true;

  if(validatableInput.required) {
    isValid = isValid && validatableInput.value.toString().trim().length !== 0;
  }

  if(
    validatableInput.minLength != null && 
    typeof validatableInput.value === 'string'
    ) {
      isValid = isValid && validatableInput.value.length >= validatableInput.minLength;
    }

  if(
    validatableInput.maxLength != null && 
    typeof validatableInput.value === 'string'
    ) {
      isValid = isValid && validatableInput.value.length <= validatableInput.maxLength;
    }

  if(
    validatableInput.min != null && 
    typeof validatableInput.value == 'number'
    ) {
      isValid = isValid && validatableInput.value >= validatableInput.min;
  }

  if(
    validatableInput.max != null && 
    typeof validatableInput.value === 'number'
    ) {
      isValid = isValid && validatableInput.value <= validatableInput.max;
  }

  return isValid;
}

/* 데코레이터 - 이벤트 리스너의 두 번째 패러미터에 메서드의 this 바인딩을 고정시켜주는 기능 */
function autobind(
  _1: any, 
  _2: string, 
  descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value; // 원래의 메서드에 접근
    const adjDescriptor: PropertyDescriptor = {
      configurable: true,
      get() { // 함수에 접근하려고할 때 실행됨
        const boundFn = originalMethod.bind(this); // bind(this)를 호출
        return boundFn;
      },
    };
    return adjDescriptor;
  }

/* HTML 요소를 동적으로 생성하고 삽입하는 기능을 담당 */
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement;
  hostElement: T;
  element: U;

  /* 템플릿 요소, 호스트 요소, 새로운 요소를 선택하고, 새로운 요소의 id를 설정하고, 삽입 위치를 결정하는 기능을 가짐 */
  constructor(
    templateId: string, 
    hostElementId: string, 
    insertAtStart: boolean, 
    newElementId?: string
    ) {
      this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
      this.hostElement = document.getElementById(hostElementId)! as T;

      const importedNode = document.importNode( // 템플릿 요소의 내용을 복사하는 메서드
        this.templateElement.content,
        true // 두 번째 패러미터로 전달하여 깊은 복사를 수행
      );
      this.element = importedNode.firstElementChild as U;

      if(newElementId) {
        this.element.id = newElementId;
      }

      this.attach(insertAtStart);
    }

  /* element 요소를 hostElement 요소에 삽입 */  
  private attach(insertAtBeggining: boolean) {
    this.hostElement.insertAdjacentElement(
      insertAtBeggining ? 'afterbegin' : 'beforeend', 
      this.element
    );
  }
  
  abstract configure?(): void;
  abstract renderContent(): void;
}

class ProjectItem extends Component<HTMLUListElement, HTMLLIElement>
 implements Draggable {
  private project: Project;

  /* project의 people 필드의 값에 따라 ‘1 person’ 또는 'n persons’라는 문자열을 반환 */
  get persons() {
    if(this.project.people === 1) {
      return '1 person';
    } else {
      return `${this.project.people} persons`;
    }
  }

  constructor(hostId: string, project: Project) {
    super('single-project', hostId, false, project.id);
    this.project = project;

    this.configure();
    this.renderContent();
  }

  @autobind
  dragStartHandler(event: DragEvent): void {
    event.dataTransfer!.setData('text/plain', this.project.id); // event 객체의 dataTransfer 속성을 사용하여 드래그할 데이터를 설정
    event.dataTransfer!.effectAllowed = 'move'; // event 객체의 dataTransfer 속성을 사용하여 드래그할 수 있는 'move’ 효과를 설정
  }

  dragEndHandler(_: DragEvent): void {
    console.log('DragEnd');
  }

  configure() {
    this.element.addEventListener('dragstart', this.dragStartHandler);
    this.element.addEventListener('dragend', this.dragEndHandler);
  }

  renderContent() {
    this.element.querySelector('h2')!.textContent = this.project.title; // 새로운 요소에서 h2 태그를 선택하고, 그 텍스트 내용을 project의 title로 설정
    this.element.querySelector('h3')!.textContent = this.persons + ' assigned.'; // 새로운 요소에서 h3 태그를 선택하고, 그 텍스트 내용을 persons 메서드의 반환값과 ’ assigned.'라는 문자열을 연결한 값으로 설정
    this.element.querySelector('p')!.textContent = this.project.description; // 새로운 요소에서 p 태그를 선택하고, 그 텍스트 내용을 project의 description으로 설정
  }
}

class ProjectList extends Component<HTMLDivElement, HTMLElement>
 implements DragTarget {
  assignedProjects: Project[];

  constructor(private type: 'active' | 'finished') { // 화면에 하나는 진행 중인 프로젝트 리스트를, 다른 하나는 완료된 프로젝트 리스트를 넣음
    super('project-list', 'app', false, `${type}-projects`);
    this.assignedProjects = [];

    this.configure();
    this.renderContent();
  }

  @autobind
  dragOverHandler(event: DragEvent) {
    if(event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
      event.preventDefault();
      const listEl = this.element.querySelector('ul')!;
      listEl.classList.add('droppable'); // listEl 요소의 클래스 목록에 ‘droppable’ 클래스를 추가
    }
  }

  @autobind
  dropHandler(event: DragEvent) {
    const prjId = event.dataTransfer!.getData('text/plain'); // event 객체의 dataTransfer 속성을 사용하여 드래그한 데이터를 가져옴
    projectState.moveProject(
      prjId, 
      this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished
    );
  }

  @autobind
  dragLeaveHandler(_: DragEvent) {
    const listEl = this.element.querySelector('ul')!;
    listEl.classList.remove('droppable'); // listEl 요소의 클래스 목록에 ‘droppable’ 클래스를 제거
  }

  configure() {
    this.element.addEventListener('dragover', this.dragOverHandler);
    this.element.addEventListener('dragleave', this.dragLeaveHandler);
    this.element.addEventListener('drop', this.dropHandler);

    /* 프로젝트 상태가 변경될 때마다 프로젝트 목록에 할당된 프로젝트들을 업데이트하고 렌더 */
    projectState.addListener((projects: Project[]) => {
      const relevantProjects = projects.filter(prj => {
        if(this.type === 'active') {
          return prj.status === ProjectStatus.Active; // projects 배열에서 상태가 Active인 프로젝트들만 필터링
        }
        
        return prj.status === ProjectStatus.Finished; // projects 배열에서 상태가 Finished인 프로젝트들만 필터링
      });
      this.assignedProjects = relevantProjects;
      this.renderProjects();
    });
  }

  /* element 요소의 내용을 프로젝트 목록의 타입에 맞게 변경함 */
  renderContent() {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector('ul')!.id = listId;
    this.element.querySelector('h2')!.textContent =
     this.type.toUpperCase() + ' PROJECTS';
  }

  /* 프로젝트 목록에 할당된 프로젝트들을 렌더 */
  private renderProjects() {
    const listEl = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement; // document에서‘{this.type}-projects-list` id를 가진 요소를 선택하고, HTMLUListElement 타입으로 변환하여 listEl 상수에 할당
    listEl.innerHTML = '';

    for(const prjItem of this.assignedProjects) {
      new ProjectItem(this.element.querySelector('ul')!.id, prjItem); // ProjectItem 클래스의 인스턴스를 생성하여 호스트 요소의 id는 새로운 요소에서 ul 태그를 선택한 요소의 id로, project 매개변수는 prjItem으로 설정
    }
  }
}

class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
  /* 생성자 필드를 초기화하기 위해 클래스 안에 새 필드를 '속성: 타입' 꼴로 선언 */
  titleInputElement: HTMLInputElement;
  descriptionInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() { // index.html의 <body />를 렌더하기 위해 사용
    super('project-input', 'app', true, 'user-input');
    /* 생성자 필드에서 타입 선언할 때 'this.속성 = <타입>~ | ~! as 타입' 2가지 방식이 있음 */
    this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement;
    this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement;
    this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement;

    this.configure();
  }

  configure() { // <form />에 리스너를 추가
    this.element.addEventListener('submit', this.submitHandler);
  }

  renderContent() {}
  
  /* 모든 입력값을 모아서 빠르게 검증하는 메서드 */
  private gatherUserInput(): [string, string, number] | void {
    const enteredTitle = this.titleInputElement.value;
    const enteredDescription = this.descriptionInputElement.value;
    const enteredPeople = this.peopleInputElement.value;

    const titleValidatable: Validatable = {
      value: enteredTitle,
      required: true
    }

    const descriptionValidatable: Validatable = {
      value: enteredDescription,
      required: true,
      minLength: 5
    }

    const peopleValidatable: Validatable = {
      value: +enteredPeople,
      required: true,
      min: 1,
      max: 5
    }

    if (
      !validate(titleValidatable) ||
      !validate(descriptionValidatable) ||
      !validate(peopleValidatable)
    ) {
      alert('Invalid input, please try again!');
      return;
    } else {
      return [enteredTitle, enteredDescription, +enteredPeople];
    }
  }

  /* 모든 입력값을 지우는 메서드 */
  private clearInputs() {
    this.titleInputElement.value = '';
    this.descriptionInputElement.value = '';
    this.peopleInputElement.value = '';
  }

  /* 프로젝트 입력 폼이 제출될 때 실행됨 */
  @autobind
  private submitHandler(event: Event) {
    event.preventDefault();
    const userInput = this.gatherUserInput(); // 사용자 입력값을 모음

    if(Array.isArray(userInput)) { // 사용자 입력값이 배열이면
      const [title, desc, people] = userInput; // 제목, 설명, 사람 수에 대해 구조 분해 할당
      projectState.addProject(title, desc, people); // 제목, 설명, 사람 수에 대한 정보를 가진 새로운 프로젝트를 프로젝트 상태에 추가
      this.clearInputs(); // 입력값들을 모두 지움
    }
  }
}

const prjInput = new ProjectInput(); // 위 클래스를 인스턴스화하여 화면에 렌더
const activePrjList = new ProjectList('active'); // 프로젝트를 활성화 목록으로 분류하는 UI 컴포넌트를 정의
const finishedPrjList = new ProjectList('finished'); // 프로젝트를 완료된 목록으로 분류하는 UI 컴포넌트를 정의