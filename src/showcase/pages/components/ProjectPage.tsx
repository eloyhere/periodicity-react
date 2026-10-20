import {
    useState,
    type Dispatch,
    type FC,
    type SetStateAction,
} from "react";
import { Inline } from "../../../arrange/layout";
import { Button, ProjectManager } from "../../../component";
import Demo from "../../Demo";
import {
    codeDependencies,
    codeProject,
    literatureDependencies,
    literatureProject,
} from "../../samples";

type ProjectKey = "periodicity" | "quiet-hours";

const projectCode: string = `<Inline gap="sm" wrap>
    <Button
        size="sm"
        variant={activeProject === "periodicity" ? "solid" : "outline"}
        onClick={() => setActiveProject("periodicity")}
    >
        Periodicity UI
    </Button>
    <Button
        size="sm"
        variant={activeProject === "quiet-hours" ? "solid" : "outline"}
        onClick={() => setActiveProject("quiet-hours")}
    >
        The Quiet Hours
    </Button>
</Inline>

<ProjectManager
    key={activeProject}
    project={activeProject === "periodicity" ? codeProject : literatureProject}
    dependencies={activeProject === "periodicity" ? codeDependencies : literatureDependencies}
    defaultMode={activeProject === "periodicity" ? "files" : "preview"}
/>`;

/**
 * Documents the project manager across a code project and a literature project.
 * @example
 * <ProjectPage />
 * @returns The Project entry.
 */
const ProjectPage: FC = () => {
    const [activeProject, setActiveProject]: [
        ProjectKey,
        Dispatch<SetStateAction<ProjectKey>>,
    ] = useState<ProjectKey>("periodicity");

    return (
        <Demo
            title="Project manager"
            description="File trees, dependencies, previews, imports, and exports for two project shapes."
            code={projectCode}
        >
            <Inline gap="sm" wrap>
                <Button
                    size="sm"
                    variant={activeProject === "periodicity" ? "solid" : "outline"}
                    onClick={(): void => setActiveProject("periodicity")}
                >
                    Periodicity UI
                </Button>
                <Button
                    size="sm"
                    variant={activeProject === "quiet-hours" ? "solid" : "outline"}
                    onClick={(): void => setActiveProject("quiet-hours")}
                >
                    The Quiet Hours
                </Button>
            </Inline>
            <ProjectManager
                key={activeProject}
                project={activeProject === "periodicity" ? codeProject : literatureProject}
                dependencies={
                    activeProject === "periodicity" ? codeDependencies : literatureDependencies
                }
                defaultMode={activeProject === "periodicity" ? "files" : "preview"}
            />
        </Demo>
    );
};

export default ProjectPage;
