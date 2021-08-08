import { DefaultTheme } from "../default/DefaultTheme";
import type { Renderer } from "../../renderer";
import { UrlMapping } from "../../models/UrlMapping";
import {
    Reflection,
    ProjectReflection,
    ContainerReflection,
} from "../../../models/reflections/index";
import { PageEvent } from "../../events";
import { NavigationItem } from "../../models/NavigationItem";
import { indexTemplate } from "./templates";
import { defaultLayout } from "./layouts/default";
import { DefaultThemeRenderContext } from "../default/DefaultThemeRenderContext";
import { header } from "./partials/header";
import { member } from "./partials/member";

export class MinimalTheme extends DefaultTheme {
    /**
     * Create a new DefaultTheme instance.
     *
     * @param renderer  The renderer this theme is attached to.
     */
    constructor(renderer: Renderer) {
        super(renderer);

        renderer.removeComponent("assets");
        renderer.removeComponent("javascript-index");
        renderer.removeComponent("navigation");
        renderer.removeComponent("toc");

        this.listenTo(renderer, PageEvent.BEGIN, this.onRendererBeginPage);
    }

    override getRenderContext(_pageEvent: PageEvent<any>) {
        this._renderContext ??= new MinimalThemeRendererContext(
            this._markedPlugin
        );
        return this._renderContext;
    }

    /**
     * Map the models of the given project to the desired output files.
     *
     * @param project  The project whose urls should be generated.
     * @returns        A list of {@link UrlMapping} instances defining which models
     *                 should be rendered to which files.
     */
    override getUrls(project: ProjectReflection): UrlMapping[] {
        const urls: UrlMapping[] = [];
        urls.push(new UrlMapping("index.html", project, this.indexTemplate));

        project.url = "index.html";
        project.anchor = undefined;
        project.hasOwnDocument = true;

        (project.children || []).forEach((child) => {
            DefaultTheme.applyAnchorUrl(child, project);
        });

        return urls;
    }

    /**
     * Triggered before a document will be rendered.
     *
     * @param page  An event object describing the current render operation.
     */
    private onRendererBeginPage(page: PageEvent<Reflection>) {
        const model = page.model;
        if (!(model instanceof Reflection)) {
            return;
        }

        page.toc = new NavigationItem();
        MinimalTheme.buildToc(page.model, page.toc);
    }

    /**
     * Create a toc navigation item structure.
     *
     * @param model   The models whose children should be written to the toc.
     * @param parent  The parent {@link Models.NavigationItem} the toc should be appended to.
     */
    static buildToc(model: Reflection, parent: NavigationItem) {
        const children = (model as ContainerReflection).children || [];
        children.forEach((child) => {
            const item = NavigationItem.create(child, parent, true);
            MinimalTheme.buildToc(child, item);
        });
    }
}

function bind<F, L extends any[], R>(fn: (f: F, ...a: L) => R, first: F) {
    return (...r: L) => fn(first, ...r);
}

export class MinimalThemeRendererContext extends DefaultThemeRenderContext {
    override indexTemplate: DefaultThemeRenderContext["indexTemplate"] = bind(
        indexTemplate,
        this
    );
    override defaultLayout: DefaultThemeRenderContext["defaultLayout"] = bind(
        defaultLayout,
        this
    );
    override header: DefaultThemeRenderContext["header"] = bind(header, this);
    override member: DefaultThemeRenderContext["member"] = bind(member, this);
}
