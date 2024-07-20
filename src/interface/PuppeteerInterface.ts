type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

interface IPuppeteerSelector {
  url: string;
  method?: Method;
  body?: any;
  selector?: string;
  func?: string;
  innerFunc?: string;
}

interface IPuppeteerBody extends IPuppeteerSelector {
  children?: Array<IPuppeteerSelector>
}