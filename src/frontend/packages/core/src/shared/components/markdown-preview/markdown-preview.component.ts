import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, Input, SecurityContext, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import * as markdown from 'marked';

import { LoggerService } from '../../../core/logger.service';

@Component({
  selector: 'app-markdown-preview',
  templateUrl: './markdown-preview.component.html',
  styleUrls: ['./markdown-preview.component.scss']
})
export class MarkdownPreviewComponent {

  markdownHtml: string;
  documentUrl: string;
  title = null;

  @Input('documentUrl')
  set setDocumentUrl(value: string) {
    if (value && this.documentUrl !== value) {
      this.documentUrl = value;
      this.title = null;
      this.loadDocument();
    }
  }

  @ViewChild('markdown') public markdown: ElementRef;

  constructor(private httpClient: HttpClient, private logger: LoggerService, private domSanitizer: DomSanitizer) { }

  private loadDocument() {
    this.httpClient.get(this.documentUrl, { responseType: 'text' }).subscribe(
      (markText) => {
        if (markText && markText.length > 0) {
          // Basic sanitization
          markdown.setOptions({
            sanitize: true,
            sanitizer: dirty => this.domSanitizer.sanitize(SecurityContext.HTML, dirty),
          });
          const renderer = new markdown.Renderer();
          // Ensure links in the readme open in a new tab
          renderer.link = (href, title, text) => {
            const link = markdown.Renderer.prototype.link.call(renderer, href, title, text);
            return link.replace('<a', '<a target="_blank" ');
          };
          this.markdownHtml = markdown(markText, { renderer });
        }
      },
      (error) => this.logger.warn(`Failed to fetch markdown with url ${this.documentUrl}: `, error));
  }

  public markdownRendered() {
    // Find the page title and move it to the header
    const h1 = this.markdown.nativeElement.getElementsByTagName('h1');
    if (this.title === null) {
      if (h1.length > 0) {
        // this.title = titleElement.innerText;
        window.setTimeout(() => {
          const titleElement = h1[0];
          const titleText = titleElement.innerText;
          this.title = titleText;
          // console.log('Got title: ' + titleText);
        }, 100);
      } else {
        this.title = 'Help';
      }
    }
  }

}
