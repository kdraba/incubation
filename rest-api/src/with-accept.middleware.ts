import {Middleware, Request, Response} from './middleware.type'
/*
async function* jsonBody(value: {} | ReadonlyArray<unknown>): Uint8Array {
  const json = JSON.stringify(value)
  const encoder = new TextEncoder()
  yield encoder.encode(json)
}*/

export type ContentTransformer<TInput> = (
  result: TInput,
) => AsyncIterator<Uint8Array>

export function withContentNegotiation<
  TContext extends Readonly<{request: Request}>,
  TContent
>({
  jsonBody,
  negotiator,
}: {
  jsonBody: (value: {} | ReadonlyArray<unknown>) => Uint8Array
  negotiator: (
    accept: string,
  ) =>
    | {
        transformer: ContentTransformer<TContent>
        type: string
      }
    | {
        transformer: false
        available: string[]
      }
}): Middleware<
  TContext,
  TContext & Readonly<{transformer: ContentTransformer<TContent>}>,
  Response
> {
  return async (context, next) => {
    const result = negotiator(context.request.headers['Accept'])

    if (!result.transformer) {
      const {available} = result
      return Promise.resolve({
        headers: {'Content-Type': 'application/json;charset=utf-8'},
        status: 406,
        content: jsonBody(available),
      })
    } else {
      const {type, transformer} = result
      const response = await next({...context, transformer})
      return {
        ...response,
        headers: {
          ...response.headers,
          'Content-Type': type,
        },
      }
    }
  }
}

/*
https://www.w3.org/TR/HTTP-in-RDF10/#ResponseHeaderClass
{
 "@context": [
   {
     "@base": "https://www.w3.org/2011/http#",
     "@vocab": "https://www.w3.org/2011/http#",
     "Header": {
       "@id": "MessageHeader",
       "@context": {
       "name": {
         "@id": "fieldValue",
         "@type": "@vocab",
         "@context": {
           "@vocab": "http://www.w3.org/2011/http-headers#",
           "Accepts": "accepts" 
         }
       },
       "value": {
         "@id": "fieldName",
         "@type": ""
       }
       }
     }
   }
 ],
 "@type": "Header",
 "name": "Accepts",
 "value": "application/json"
}


{
  $defs: {
    Header: {
    "@base": "https://www.w3.org/2011/http#",
    "@vocab": "https://www.w3.org/2011/http#",
    
    type: "object",
    "@id": "MessageHeader",
    properties: {
      name: {
        type: "string",
        const: "Content-Type"
        "@id": "fieldValue",
        "@type": "@vocab",
        "@context": {
          "@vocab": "http://www.w3.org/2011/http-headers#",
          "Content-Type": "content-type" 
        }
      }
      value: {
        type: "string",
        "@id": "fieldName",
      }
    },
    NotAcceptable: {
      "@base": "https://www.w3.org/2011/http#",
      "@vocab": "https://www.w3.org/2011/http#",
    
      type: "array",
      items: {
        $ref: "#/$defs/Header"
      }
    }
  }  
}




outcomes
{
  acceptable: {
    headers: negotiator.availableTypes
  },
  notAcceptable: {
    status: 406,
    schema: notAcceptable
  }
}


{
  found: {

  },
  notFound {
    status: 404,
    schema: notFound
  }
}

[
  {
    status: 404,
    next: false,
    condition: () => {
       const result = negotiator(context.request.headers['Accept'])
       return result.transformer
    }
  },
  {
    next: () =>,
    headers: {
          ...response.headers,
          'Content-Type': type,
        }
  }
]
*/
