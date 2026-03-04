# Rails 8 removed the asset pipeline (sprockets), but avo-icons/inline_svg
# still references `Rails.application.config.assets` which no longer exists.
# This initializer patches the Avo::Icons::SvgFinder to skip the asset pipeline
# lookup and fall back to file-based path resolution instead.

Rails.application.config.after_initialize do
  if defined?(Avo::Icons::SvgFinder)
    Avo::Icons::SvgFinder.class_eval do
      def default_strategy
        # Propshaft support (Rails 8 default asset handler)
        if defined?(Propshaft) && ::Rails.application.respond_to?(:assets) && ::Rails.application.assets
          asset_path = ::Rails.application.assets.load_path.find(@filename)
          asset_path&.path
        else
          # No asset pipeline available — return nil to fall through to file-based paths
          nil
        end
      end

      # Also patch `paths` to avoid calling config.assets.paths
      alias_method :original_paths, :paths

      def paths
        base_paths = [
          Rails.root.join("app", "assets", "svgs", @filename),
          Rails.root.join(@filename),
          Avo::Icons.root.join("assets", "svgs", @filename),
          Avo::Icons.root.join("assets", "svgs", "heroicons", "outline", @filename),
          Avo::Icons.root.join("assets", "svgs", "heroicons", "solid", @filename),
          Avo::Icons.root.join("assets", "svgs", "heroicons", "mini", @filename),
          Avo::Icons.root.join("assets", "svgs", "heroicons", "micro", @filename),
          Avo::Icons.root.join("assets", "svgs", "tabler", "outline", @filename),
          Avo::Icons.root.join("assets", "svgs", "tabler", "filled", @filename)
        ]

        custom_paths = Avo::Icons.configuration.custom_paths.map do |custom_path|
          if custom_path.is_a?(Proc)
            custom_path.call(@filename)
          else
            File.join(custom_path.to_s, @filename)
          end
        end

        (base_paths + custom_paths).map(&:to_s).uniq
      end
    end
  end
end
