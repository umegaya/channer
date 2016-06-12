

declare module 'react-canvas' {
  import React = require('react');


  type Style = {
    //Text Related props
    color?: string;
    fontFace?: FontFace;
    fontSize?: number;
    lineHeight?: number;
    textAlign?: string

    // Layer style
    backgroundColor?: string;
    borderColor?: string;
    borderRedius?: number;
    clipRect?: string;
    zIndex?: number; 
    alpha?: number; 
    scale?: number; 
    translateX?: number; 
    translateY?: number; 

    ///CSS Layout style

    top?: number;
    left?: number;
    right?: number;
    bottom?: number;

    width?: number | string;
    height?: number | string;

    margin?: number;
    marginLeft?: number;
    marginRight?: number;
    marginTop?: number;
    marginBottom?: number;

    padding?: number;
    paddingLeft?: number;
    paddingRight?: number;
    paddingTop?: number;
    paddingBottom?: number;

    borderWidth?: number;
    borderLeftWidth?: number;
    borderRightWidth?: number;
    borderTopWidth?: number;
    borderBottomWidth?: number;

    flexDirection?: string;
    justifyContent?: string;
    alignItems?: string; 
    alignSelf?: string;

    flex?: number;
    position?: string
  }

  type SurfaceProps = {
    width: number;
    height: number;
    top: number;
    left: number;

    scale?: number;
    enableCSSLayout?: boolean;
  } 

  class Surface extends React.Component<SurfaceProps,{}> {}


  type ComponentProps = {
    style?:Style;

    onTouchStart?: React.TouchEventHandler;
    onTouchMove?: React.TouchEventHandler;
    onTouchEnd?: React.TouchEventHandler;
    onTouchCancel?: React.TouchEventHandler;
    onClick?: React.MouseEventHandler
  }

  class Layer extends React.Component<ComponentProps,{}> {}

  class Group extends React.Component<ComponentProps,{}> {}

  class Text extends React.Component<ComponentProps,{}> { }


  type ImageProps = {
    src: string;
    style?:Style;
    useBackingStore?: boolean;
    fadeIn?: boolean;
    fadeInDuration?: boolean;
  }

  class Image extends React.Component<ImageProps,{}> {}


  class FontFace {
    constructor(family: string, url?: string, attributes?: { style: string; weight: number});
    static Default: FontFace;

    private _fontFaceBrand: any;

    public id: string;
    public family: string;
    public url: string;
    public attributes: string;
  }

  type Measure = {
    width: number;
    height: number;
  }

  function measureText(text: string, width: number, fontFace: FontFace, fontSize: number, lineHeight: number): Measure;

  type ListViewProps = {
      style?: {};
      numberOfItemsGetter: () => number;
      itemHeightGetter: (index: number) => number;
      itemGetter: (index: number, scrollTop: number) => JSX.Element;
      snapping?: boolean;
      scrollingDeceleration?: number;
      scrollingPenetrationAcceleration?: number;
      onScroll?: React.EventHandler<React.SyntheticEvent>;
  }

  class ListView extends React.Component<ListViewProps,{}> {

  }
}
