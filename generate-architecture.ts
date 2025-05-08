import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

interface ClassInfo {
    name: string;
    description: string;
    methods: MethodInfo[];
    properties: PropertyInfo[];
    patterns: string[];
    states: string[];
    dataFlows: DataFlowInfo[];
    lifecycle: LifecycleInfo[];
    extends?: string;
}

interface MethodInfo {
    name: string;
    description: string;
    parameters: ParameterInfo[];
    returnType: string;
    returnDescription: string;
    isPrivate: boolean;
    patterns: string[];
    isStatic: boolean;
    dependencies: string[];
}

interface PropertyInfo {
    name: string;
    type: string;
    description: string;
    isStatic: boolean;
    isReadonly: boolean;
    isPrivate: boolean;
}

interface ParameterInfo {
    name: string;
    type: string;
    description: string;
    isOptional: boolean;
}

interface DataFlowInfo {
    source: string;
    target: string;
    description: string;
    methods: string[];
}

interface LifecycleInfo {
    stage: string;
    description: string;
    methods: string[];
}

class ArchitectureGenerator {
    private program: ts.Program;
    private checker: ts.TypeChecker;
    private classes: Map<string, ClassInfo> = new Map();

    constructor(sourceFiles: string[]) {
        this.program = ts.createProgram(sourceFiles, {
            target: ts.ScriptTarget.ES2020,
            module: ts.ModuleKind.CommonJS,
            experimentalDecorators: true,
            emitDecoratorMetadata: true,
            allowJs: true,
            checkJs: false
        });
        this.checker = this.program.getTypeChecker();
    }

    public generateArchitecture(): string {
        // Анализируем все файлы
        for (const sourceFile of this.program.getSourceFiles()) {
            if (!sourceFile.isDeclarationFile) {
                this.visitNode(sourceFile);
            }
        }

        // Генерируем документацию
        return this.generateMarkdown();
    }

    private visitNode(node: ts.Node) {
        if (ts.isClassDeclaration(node) && node.name) {
            const className = node.name.text;
            const classInfo: ClassInfo = {
                name: className,
                description: this.getJSDocDescription(node) || '',
                methods: [],
                properties: [],
                patterns: this.extractPatterns(ts.getJSDocTags(node)),
                states: this.extractStates(node),
                dataFlows: this.extractDataFlows(ts.getJSDocTags(node)),
                lifecycle: this.extractLifecycle(ts.getJSDocTags(node)),
                extends: this.getExtends(node)
            };

            // Анализируем члены класса
            node.members.forEach(member => {
                if (ts.isMethodDeclaration(member)) {
                    classInfo.methods.push(this.analyzeMethodJSDoc(member));
                } else if (ts.isPropertyDeclaration(member)) {
                    classInfo.properties.push(this.analyzePropertyJSDoc(member));
                }
            });

            // Анализируем дополнительные аспекты
            classInfo.states = this.analyzeStates(classInfo);
            classInfo.dataFlows = this.analyzeDataFlows(classInfo);
            classInfo.lifecycle = this.analyzeLifecycle(classInfo);
            classInfo.patterns = this.analyzePatterns(classInfo);

            this.classes.set(className, classInfo);
        }

        ts.forEachChild(node, child => this.visitNode(child));
    }

    private analyzeMethodJSDoc(node: ts.MethodDeclaration): MethodInfo {
        const methodName = node.name.getText();
        const jsDoc = ts.getJSDocTags(node);
        
        return {
            name: methodName,
            description: this.extractDescription(jsDoc) || '',
            parameters: this.extractParameters(jsDoc),
            returnType: this.extractReturnType(jsDoc) || '',
            returnDescription: this.extractReturnDescription(jsDoc) || '',
            isPrivate: methodName.startsWith('_'),
            patterns: this.extractPatterns(jsDoc),
            isStatic: node.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword) || false,
            dependencies: this.extractDependencies(node)
        };
    }

    private analyzePropertyJSDoc(node: ts.PropertyDeclaration): PropertyInfo {
        const propertyName = node.name.getText();
        const jsDoc = ts.getJSDocTags(node);
        
        return {
            name: propertyName,
            type: node.type ? node.type.getText() : 'any',
            description: this.extractDescription(jsDoc) || '',
            isStatic: node.modifiers?.some(m => m.kind === ts.SyntaxKind.StaticKeyword) || false,
            isReadonly: node.modifiers?.some(m => m.kind === ts.SyntaxKind.ReadonlyKeyword) || false,
            isPrivate: propertyName.startsWith('_')
        };
    }

    private extractDependencies(node: ts.MethodDeclaration): string[] {
        const dependencies: string[] = [];
        if (node.body) {
            const visitor = (node: ts.Node) => {
                if (ts.isPropertyAccessExpression(node)) {
                    const expression = node.expression.getText();
                    if (expression !== 'this' && !dependencies.includes(expression)) {
                        dependencies.push(expression);
                    }
                }
                ts.forEachChild(node, visitor);
            };
            ts.forEachChild(node.body, visitor);
        }
        return dependencies;
    }

    private getJSDocDescription(node: ts.Node): string | undefined {
        const jsDoc = ts.getJSDocTags(node);
        if (jsDoc.length > 0) {
            return jsDoc.map(tag => {
                if (tag.tagName.text === 'param' && typeof tag.comment === 'string') {
                    const [paramName, ...rest] = tag.comment.split(' ');
                    const paramDesc = rest.join(' ');
                    return `@param ${paramName} - ${paramDesc}`;
                }
                return typeof tag.comment === 'string' ? tag.comment : '';
            }).join('\n');
        }
        return undefined;
    }

    private analyzePatterns(classInfo: ClassInfo): string[] {
        const patterns: string[] = [];
        
        // Анализируем методы и свойства для определения паттернов
        const methodNames = classInfo.methods.map(m => m.name);
        const propertyNames = classInfo.properties.map(p => p.name);
        
        // State Pattern
        if (methodNames.some(m => m.includes('State')) && 
            propertyNames.some(p => p.includes('STATE'))) {
            patterns.push('State Pattern - управление состоянием объекта');
        }
        
        // Template Method
        if (classInfo.extends && 
            methodNames.some(m => m.startsWith('handle')) && 
            methodNames.some(m => m === 'handleState')) {
            patterns.push('Template Method - определение общего алгоритма в базовом классе');
        }
        
        // Proxy Pattern
        if (methodNames.some(m => m.includes('Proxy')) || 
            methodNames.some(m => m.includes('createProxy'))) {
            patterns.push('Proxy Pattern - контроль доступа к объекту');
        }
        
        // Dependency Injection
        if (methodNames.some(m => m.includes('inject')) || 
            methodNames.some(m => m.includes('setDependency'))) {
            patterns.push('Dependency Injection - внедрение зависимостей');
        }
        
        // Observer Pattern
        if (methodNames.some(m => m.includes('notify')) || 
            methodNames.some(m => m.includes('subscribe'))) {
            patterns.push('Observer Pattern - реализация механизма подписки');
        }
        
        // Strategy Pattern
        if (methodNames.some(m => m.includes('Strategy')) || 
            methodNames.some(m => m.includes('setStrategy'))) {
            patterns.push('Strategy Pattern - инкапсуляция алгоритмов');
        }
        
        return patterns;
    }

    private analyzeLifecycle(classInfo: ClassInfo): LifecycleInfo[] {
        const lifecycle: LifecycleInfo[] = [];

        // Анализируем методы для определения жизненного цикла
        for (const method of classInfo.methods) {
            const methodName = method.name.toLowerCase();
            
            // Создание
            if (methodName.includes('create') || methodName.includes('new') || methodName === 'constructor') {
                lifecycle.push({
                    stage: 'Создание',
                    description: method.name,
                    methods: [method.name]
                });
            }
            
            // Инициализация
            if (methodName.includes('init') || methodName.includes('setup') || methodName.includes('configure')) {
                lifecycle.push({
                    stage: 'Инициализация',
                    description: method.name,
                    methods: [method.name]
                });
            }
            
            // Основной цикл
            if (methodName.includes('handle') || methodName.includes('process') || methodName.includes('update')) {
                lifecycle.push({
                    stage: 'Основной цикл',
                    description: method.name,
                    methods: [method.name]
                });
            }
            
            // Очистка
            if (methodName.includes('cleanup') || methodName.includes('destroy') || methodName.includes('dispose')) {
                lifecycle.push({
                    stage: 'Очистка',
                    description: method.name,
                    methods: [method.name]
                });
            }
        }

        return lifecycle;
    }

    private analyzeStates(classInfo: ClassInfo): string[] {
        const states: string[] = [];
        
        // Ищем константы состояний
        for (const prop of classInfo.properties) {
            if (prop.name.includes('STATE_')) {
                states.push(prop.name);
            }
        }
        
        // Ищем методы обработки состояний
        for (const method of classInfo.methods) {
            if (method.name.startsWith('handle') && method.name.endsWith('State')) {
                const stateName = method.name.replace('handle', '').replace('State', '');
                if (!states.includes(stateName)) {
                    states.push(stateName);
                }
            }
        }
        
        return states;
    }

    private analyzeDataFlows(classInfo: ClassInfo): DataFlowInfo[] {
        const dataFlows: DataFlowInfo[] = [];
        
        // Анализируем методы для определения потоков данных
        for (const method of classInfo.methods) {
            // Ищем методы, которые работают с данными
            if (method.name.includes('get') || method.name.includes('set') || 
                method.name.includes('update') || method.name.includes('process')) {
                
                // Анализируем параметры метода
                const params = method.parameters.map(p => p.name);
                
                // Анализируем зависимости
                for (const dep of method.dependencies) {
                    dataFlows.push({
                        source: classInfo.name,
                        target: dep,
                        description: `Передает данные от ${classInfo.name} к ${dep}`,
                        methods: [method.name]
                    });
                }
            }
        }
        
        return dataFlows;
    }

    private generateMarkdown(): string {
        let markdown = '# Архитектура проекта Screeps\n\n';
        
        // Добавляем общее описание проекта из package.json
        markdown += '## Общее описание\n\n';
        markdown += 'Проект представляет собой AI для игры Screeps, реализующий автоматическое управление колонией.\n\n';

        // Генерируем диаграмму классов
        markdown += '## Диаграмма классов\n\n';
        markdown += this.generateClassDiagram();

        // Генерируем описание каждого класса
        markdown += '## Детальное описание классов\n\n';
        for (const [className, classInfo] of this.classes) {
            markdown += this.generateClassDocumentation(className, classInfo);
        }

        // Анализируем и добавляем описание паттернов
        const allPatterns = new Set<string>();
        for (const [_, classInfo] of this.classes) {
            const patterns = this.analyzePatterns(classInfo);
            patterns.forEach(p => allPatterns.add(p));
        }

        if (allPatterns.size > 0) {
            markdown += '## Используемые паттерны и принципы\n\n';
            allPatterns.forEach(pattern => {
                markdown += `- **${pattern}**\n`;
            });
            markdown += '\n';
        }

        return markdown;
    }

    private generateClassDiagram(): string {
        let diagram = '```mermaid\nclassDiagram\n';
        
        // Добавляем классы и их связи
        for (const [className, classInfo] of this.classes) {
            if (classInfo.extends) {
                diagram += `    ${classInfo.extends} <|-- ${className}\n`;
            }
        }

        // Добавляем содержимое классов
        for (const [className, classInfo] of this.classes) {
            diagram += `    class ${className} {\n`;
            
            // Добавляем свойства
            for (const prop of classInfo.properties) {
                const visibility = prop.isPrivate ? '-' : '+';
                const staticModifier = prop.isStatic ? 'static ' : '';
                diagram += `        ${visibility}${staticModifier}${prop.name}\n`;
            }

            // Добавляем методы
            for (const method of classInfo.methods) {
                const visibility = method.isPrivate ? '-' : '+';
                const staticModifier = method.isStatic ? 'static ' : '';
                diagram += `        ${visibility}${staticModifier}${method.name}()\n`;
            }

            diagram += '    }\n';
        }

        diagram += '```\n\n';
        return diagram;
    }

    private generateClassDocumentation(className: string, classInfo: ClassInfo): string {
        let doc = `### ${className}\n\n`;
        
        if (classInfo.description) {
            doc += `${classInfo.description}\n\n`;
        }

        // Добавляем информацию о наследовании
        if (classInfo.extends) {
            doc += `**Наследуется от:** \`${classInfo.extends}\`\n\n`;
        }

        // Анализируем и добавляем информацию о паттернах
        const patterns = this.analyzePatterns(classInfo);
        if (patterns.length > 0) {
            doc += '**Используемые паттерны:**\n';
            patterns.forEach(pattern => {
                doc += `- ${pattern}\n`;
            });
            doc += '\n';
        }

        // Добавляем информацию о жизненном цикле
        const lifecycle = this.analyzeLifecycle(classInfo);
        if (lifecycle.length > 0) {
            doc += '**Жизненный цикл:**\n';
            lifecycle.forEach(stage => {
                doc += `- ${stage.description}\n`;
            });
            doc += '\n';
        }

        // Добавляем информацию о состояниях
        const states = this.analyzeStates(classInfo);
        if (states.length > 0) {
            doc += '**Состояния:**\n';
            states.forEach(state => {
                doc += `- ${state}\n`;
            });
            doc += '\n';
        }

        // Добавляем информацию о потоках данных
        const dataFlows = this.analyzeDataFlows(classInfo);
        if (dataFlows.length > 0) {
            doc += '**Потоки данных:**\n';
            dataFlows.forEach(flow => {
                doc += `- ${flow.description}\n`;
            });
            doc += '\n';
        }

        // Добавляем описание свойств
        if (classInfo.properties.length > 0) {
            doc += '#### Свойства\n\n';
            for (const prop of classInfo.properties) {
                doc += `- \`${prop.name}\`: ${prop.type || 'any'}\n`;
                if (prop.description) {
                    doc += `  ${prop.description}\n`;
                }
            }
            doc += '\n';
        }

        // Добавляем описание методов
        if (classInfo.methods.length > 0) {
            doc += '#### Методы\n\n';
            for (const method of classInfo.methods) {
                const visibility = method.isPrivate ? 'private ' : 'public ';
                const staticModifier = method.isStatic ? 'static ' : '';
                doc += `- \`${visibility}${staticModifier}${method.name}(${method.parameters.map(p => 
                    `${p.name}: ${p.type || 'any'}`).join(', ')}): ${method.returnType || 'void'}\`\n`;
                
                if (method.description) {
                    doc += `  ${method.description}\n`;
                }

                if (method.dependencies.length > 0) {
                    doc += `  **Использует:** ${method.dependencies.map(d => `\`${d}\``).join(', ')}\n`;
                }
            }
            doc += '\n';
        }

        return doc;
    }

    private getExtends(node: ts.ClassDeclaration): string | undefined {
        if (node.heritageClauses) {
            for (const clause of node.heritageClauses) {
                if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
                    return clause.types[0].expression.getText();
                }
            }
        }
        return undefined;
    }

    private extractDescription(jsDoc: readonly ts.JSDocTag[]): string {
        const descriptionTag = jsDoc.find(tag => tag.tagName.getText() === 'description');
        return descriptionTag ? descriptionTag.comment?.toString() || '' : '';
    }

    private extractParameters(jsDoc: readonly ts.JSDocTag[]): ParameterInfo[] {
        const parameters: ParameterInfo[] = [];
        jsDoc.forEach(tag => {
            if (tag.tagName.getText() === 'param') {
                const paramMatch = tag.comment?.toString().match(/@param\s+{([^}]+)}\s+(\w+)\s+-\s+(.+)/);
                if (paramMatch) {
                    parameters.push({
                        name: paramMatch[2],
                        type: paramMatch[1] || 'any',
                        description: paramMatch[3] || '',
                        isOptional: paramMatch[1]?.includes('?') || false
                    });
                }
            }
        });
        return parameters;
    }

    private extractReturnType(jsDoc: readonly ts.JSDocTag[]): string {
        const returnTag = jsDoc.find(tag => tag.tagName.getText() === 'returns');
        if (returnTag) {
            const returnMatch = returnTag.comment?.toString().match(/{([^}]+)}/);
            return returnMatch ? returnMatch[1] : '';
        }
        return '';
    }

    private extractReturnDescription(jsDoc: readonly ts.JSDocTag[]): string {
        const returnTag = jsDoc.find(tag => tag.tagName.getText() === 'returns');
        if (returnTag) {
            const returnMatch = returnTag.comment?.toString().match(/}\s+(.+)/);
            return returnMatch ? returnMatch[1] : '';
        }
        return '';
    }

    private extractPatterns(jsDoc: readonly ts.JSDocTag[]): string[] {
        const patterns: string[] = [];
        jsDoc.forEach(tag => {
            if (tag.tagName.getText() === 'description') {
                const comment = tag.comment?.toString() || '';
                if (comment.includes('паттерн')) {
                    const patternMatch = comment.match(/паттерн (\w+)/);
                    if (patternMatch) {
                        patterns.push(patternMatch[1]);
                    }
                }
            }
        });
        return patterns;
    }

    private extractLifecycle(jsDoc: readonly ts.JSDocTag[]): LifecycleInfo[] {
        const lifecycle: LifecycleInfo[] = [];
        
        jsDoc.forEach(tag => {
            if (tag.tagName.getText() === 'description') {
                const comment = tag.comment?.toString() || '';
                if (comment.includes('жизненный цикл')) {
                    const stageMatch = comment.match(/этап (\w+)/);
                    if (stageMatch) {
                        lifecycle.push({
                            stage: stageMatch[1],
                            description: comment,
                            methods: []
                        });
                    }
                }
            }
        });
        
        return lifecycle;
    }

    private extractDataFlows(jsDoc: readonly ts.JSDocTag[]): DataFlowInfo[] {
        const dataFlows: DataFlowInfo[] = [];
        
        jsDoc.forEach(tag => {
            if (tag.tagName.getText() === 'description') {
                const comment = tag.comment?.toString() || '';
                if (comment.includes('поток данных')) {
                    const flowMatch = comment.match(/поток данных от (\w+) к (\w+)/);
                    if (flowMatch) {
                        dataFlows.push({
                            source: flowMatch[1],
                            target: flowMatch[2],
                            description: comment,
                            methods: []
                        });
                    }
                }
            }
        });
        
        return dataFlows;
    }

    private extractStates(node: ts.ClassDeclaration): string[] {
        const states: string[] = [];
        
        node.members.forEach(member => {
            if (ts.isPropertyDeclaration(member) && 
                member.name.getText().includes('STATE_')) {
                states.push(member.name.getText());
            }
        });
        
        return states;
    }
}

// Использование
const sourceFiles = [
    'GameStateManager.js',
    'CreepBase.js',
    'Harvester.js',
    'Builder.js',
    'Carrier.js',
    'Attacker.js',
    'Logger.js',
    'config.js',
    'screeps_constants.js'
].map(file => path.join(process.cwd(), file));

const generator = new ArchitectureGenerator(sourceFiles);
const architecture = generator.generateArchitecture();

fs.writeFileSync(path.join(process.cwd(), 'architecture.md'), architecture); 